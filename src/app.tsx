import * as React from 'react'
import { Change, Dispatch } from 'raj-ts'
import { withSubscriptions } from 'raj-ts/lib/subscription'
import { Country, getCompleteCountries } from './country-data'

type Direction = 'forward' | Side
type Side = 'left' | 'right'
type Mode = 'easy' | 'hard'
type Icon = { label: string; url: string }

type Layout = {
  forward: Side
  forwardIcon: Icon

  left: Side
  leftIcon: Icon

  right: Side
  rightIcon: Icon
}

type Model = {
  scene: 'home' | 'game'
  mode: Mode
  layout: Layout

  previousSide: Side
  carProgress: number
  carVelocity: number
  lastTickedAt: number

  instruction: Direction
  roadMarker:
    | {
        type: 'pass' | 'fail'
        way:
          | 'all'
          | {
              dir: Direction
              side: Side
            }
      }
    | undefined

  score: number
  highScore: number

  transitioning: boolean
}

type Msg =
  | { type: 'start_game'; mode: Mode }
  | { type: 'start_next_round' }
  | { type: 'clear_game_scene' }
  | { type: 'choose_path'; dir: Direction; side: Side }
  | { type: 'game_tick' }

function checkChoice(
  layout: Layout,
  instruction: Direction,
  choice: { dir: Direction; side: Side }
): boolean {
  if (choice.dir !== instruction) {
    return false
  }

  if (choice.side !== layout[instruction]) {
    return false
  }

  return true
}

const highScoreKey = 'high_score'

function getSavedHighScore(mode: Mode): number {
  const savedValue = window.localStorage.getItem(`${highScoreKey}.${mode}`)
  const value = savedValue !== null ? parseInt(savedValue, 10) : undefined
  if (!(typeof value === 'number' && isFinite(value))) {
    return 0
  }

  return value
}

function setHighScore(mode: Mode, score: number) {
  window.localStorage.setItem(`${highScoreKey}.${mode}`, score.toString())
}

function randomItem<A>(list: A[]): A {
  return list[Math.floor(Math.random() * list.length)]
}

const possibleInstructions: Direction[] = ['left', 'right', 'forward']

function makeRandomInstruction(): Direction {
  return randomItem(possibleInstructions)
}

const possibleSides: Side[] = ['left', 'right']

const allCountries = getCompleteCountries()
const leftCountries = allCountries.filter((c) => c.side === 'left')
const rightCountries = allCountries.filter((c) => c.side === 'right')

function getSimpleSideIcon(side: Side): Icon {
  switch (side) {
    case 'left':
      return { label: 'Left', url: './left.svg' }
    case 'right':
      return { label: 'Right', url: './right.svg' }
  }
}

function getRandomCountryIcon(side: Side): Icon {
  let country: Country
  switch (side) {
    case 'left':
      country = randomItem(leftCountries)
      break
    case 'right':
      country = randomItem(rightCountries)
      break
  }

  return {
    label: country.name,
    url: country.imageUrl,
  }
}

function makeRandomLayout(mode: Mode): Layout {
  const forward = randomItem(possibleSides)
  const left = randomItem(possibleSides)
  const right = randomItem(possibleSides)

  let forwardIcon: Icon
  let leftIcon: Icon
  let rightIcon: Icon
  switch (mode) {
    case 'easy':
      forwardIcon = getSimpleSideIcon(forward)
      leftIcon = getSimpleSideIcon(left)
      rightIcon = getSimpleSideIcon(right)
      break
    case 'hard':
      forwardIcon = getRandomCountryIcon(forward)
      leftIcon = getRandomCountryIcon(left)
      rightIcon = getRandomCountryIcon(right)
      break
  }

  return {
    forward,
    forwardIcon,
    left,
    leftIcon,
    right,
    rightIcon,
  }
}

function makeFailState(
  model: Model,
  way: NonNullable<Model['roadMarker']>['way']
): Change<Msg, Model> {
  return [
    {
      ...model,
      roadMarker: { type: 'fail', way },
    },
    function saveHighScore() {
      const highScore = getSavedHighScore(model.mode)
      if (model.score > highScore) {
        setHighScore(model.mode, model.score)
      }
    },
  ]
}

export const appProgram = withSubscriptions<Msg, Model, React.ReactNode>({
  init: [
    {
      scene: 'home',
      mode: 'easy',
      layout: makeRandomLayout('easy'),
      previousSide: 'right',
      carProgress: 0.5,
      carVelocity: 0,
      lastTickedAt: 0,
      instruction: 'forward',
      roadMarker: undefined,
      score: 0,
      highScore: 0,
      transitioning: false,
    },
  ],
  update(msg, model) {
    switch (msg.type) {
      case 'start_game': {
        return [
          {
            ...model,
            mode: msg.mode,
            scene: 'game',
            score: 0,
            carProgress: 0,
            carVelocity: 0.01,
            lastTickedAt: Date.now(),
            roadMarker: undefined,
            instruction: makeRandomInstruction(),
            layout: makeRandomLayout(msg.mode),
            highScore: getSavedHighScore(msg.mode),
          },
        ]
      }
      case 'choose_path': {
        if (model.roadMarker) {
          return [model]
        }

        const isCorrect = checkChoice(model.layout, model.instruction, msg)
        if (!isCorrect) {
          return makeFailState(model, {
            dir: msg.dir,
            side: msg.side,
          })
        }
        const newScore = model.score + 1
        return [
          {
            ...model,
            score: newScore,
            highScore: Math.max(newScore, model.highScore),
            roadMarker: { type: 'pass', way: { dir: msg.dir, side: msg.side } },
          },
          function (dispatch: Dispatch<Msg>) {
            setTimeout(() => dispatch({ type: 'clear_game_scene' }), 250)
            setTimeout(() => dispatch({ type: 'start_next_round' }), 500)
          },
        ]
      }
      case 'clear_game_scene': {
        return [
          {
            ...model,
            carProgress: 0,
            instruction: makeRandomInstruction(),
            layout: makeRandomLayout(model.mode),
            previousSide: model.layout[model.instruction],
            roadMarker: undefined,
            transitioning: true,
          },
        ]
      }
      case 'start_next_round':
        return [
          {
            ...model,
            carProgress: 0,
            carVelocity: model.carVelocity + 0.001,
            lastTickedAt: Date.now(),
            transitioning: false,
          },
        ]
      case 'game_tick': {
        const tickedAt = Date.now()
        const newProgress = Math.max(
          model.carProgress +
            (tickedAt - model.lastTickedAt) * model.carVelocity,
          1
        )

        if (newProgress >= 100) {
          return makeFailState({ ...model, carProgress: 100 }, 'all')
        }

        return [
          {
            ...model,
            carProgress: newProgress,
            lastTickedAt: tickedAt,
          },
        ]
      }
    }
  },
  subscriptions(model) {
    return {
      tick:
        model.scene === 'game' && !model.roadMarker
          ? () => {
              let timerId: any

              return {
                effect(dispatch) {
                  timerId = setInterval(
                    () => dispatch({ type: 'game_tick' }),
                    50
                  )
                },
                cancel() {
                  clearInterval(timerId)
                },
              }
            }
          : undefined,
    }
  },
  view,
})

function Indicator({ icon }: { icon: Icon }) {
  return <img className="indicator" alt={icon.label} src={icon.url} />
}

function Car({ progress }: { progress: number }) {
  return (
    <img
      className="car"
      alt="Car"
      src="/car.svg"
      style={{ top: `${100 - progress}%` }}
    />
  )
}

function Road({
  dir,
  side,
  marker,
  dispatch,
}: {
  dir: Direction
  side: Side
  marker: Model['roadMarker']
  dispatch: Dispatch<Msg>
}) {
  let content
  let className = 'road'
  if (marker) {
    const { way } = marker
    if (way === 'all' || (way.dir === dir && way.side === side)) {
      let src
      switch (marker.type) {
        case 'pass':
          src = '/pass.svg'
          className += ' road--pass'
          break
        case 'fail':
          src = '/fail.svg'
          className += ' road--fail'
          break
      }

      content = <img className="indicator" alt={marker.type} src={src} />
    }
  }

  return (
    <td
      onClick={() => dispatch({ type: 'choose_path', dir, side })}
      className={className}
    >
      {content}
    </td>
  )
}

function view(model: Model, dispatch: Dispatch<Msg>) {
  ;(window as any).$model = model
  return (
    <div className="ground">
      <table className={model.transitioning ? 'spin-zone' : ''}>
        <tbody>
          <tr>
            <td className="grass">
              <h1 className="title">Re:Turn</h1>
            </td>
            <Road
              {...{
                dir: 'forward',
                side: 'left',
                marker: model.roadMarker,
                dispatch,
              }}
            />
            <td className="grass" style={{ textAlign: 'center' }}>
              <Indicator icon={model.layout.forwardIcon} />
            </td>
            <Road
              {...{
                dir: 'forward',
                side: 'right',
                marker: model.roadMarker,
                dispatch,
              }}
            />
            <td className="grass" />
          </tr>
          <tr>
            <Road
              {...{
                dir: 'left',
                side: 'right',
                marker: model.roadMarker,
                dispatch,
              }}
            />
            <td className="road" />
            <td className="road" />
            <td className="road" />
            <Road
              {...{
                dir: 'right',
                side: 'left',
                marker: model.roadMarker,
                dispatch,
              }}
            />
          </tr>
          <tr>
            <td
              className="grass"
              style={{ textAlign: 'right', paddingRight: '4vw' }}
            >
              <Indicator icon={model.layout.leftIcon} />
            </td>
            <td className="road" />
            <td className="road">
              {model.roadMarker?.type === 'fail' ? (
                <p className="instruction">
                  Wrong way!
                  <br />
                  <b>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        dispatch({ type: 'start_game', mode: model.mode })
                      }}
                      className="text-inherit"
                    >
                      Replay?
                    </button>
                  </b>
                </p>
              ) : (
                model.scene === 'game' &&
                model.instruction !== 'forward' && (
                  <p className="instruction">
                    Turn
                    <br />
                    <b
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.preventDefault()
                        dispatch({ type: 'start_game', mode: model.mode })
                      }}
                    >
                      {model.instruction === 'left' ? 'Left' : 'Right'}
                    </b>
                  </p>
                )
              )}
            </td>
            <td className="road" />
            <td
              className="grass"
              style={{ textAlign: 'left', paddingLeft: '4vw' }}
            >
              <Indicator icon={model.layout.rightIcon} />
            </td>
          </tr>
          <tr>
            <Road
              {...{
                dir: 'left',
                side: 'left',
                marker: model.roadMarker,
                dispatch,
              }}
            />
            <td className="road" />
            <td className="road" />
            <td className="road" />
            <Road
              {...{
                dir: 'right',
                side: 'right',
                marker: model.roadMarker,
                dispatch,
              }}
            />
          </tr>
          <tr className="drive-up">
            <td className="grass">
              {model.scene === 'home' ? (
                <div className="modes">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      dispatch({ type: 'start_game', mode: 'easy' })
                    }}
                  >
                    Play easy mode
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      dispatch({ type: 'start_game', mode: 'hard' })
                    }}
                  >
                    Play hard mode
                  </button>
                </div>
              ) : (
                <p className="score">
                  Score
                  <br />
                  <b>{model.score}</b>
                </p>
              )}
            </td>
            <td className="road">
              <div className="car-track">
                {model.previousSide === 'left' && (
                  <Car progress={model.carProgress} />
                )}
              </div>
            </td>
            <td className="grass" />
            <td className="road">
              <div className="car-track">
                {model.previousSide === 'right' && (
                  <Car progress={model.carProgress} />
                )}
              </div>
            </td>
            <td className="grass">
              {model.scene === 'home' ? (
                <div className="about">
                  <p>
                    Welcome to the most hazardous intersection on the internet
                    where the correct way isn't just left or right or straight
                    ahead, it's also which side of the road to drive on!
                  </p>

                  <p>
                    Made by <a href="https://jew.ski">Chris Andrejewski</a>
                  </p>
                </div>
              ) : (
                <p className="score score--high">
                  High
                  <br />
                  <b>{model.highScore}</b>
                </p>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
