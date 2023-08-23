import * as React from 'react'
import { Change, Dispatch } from 'raj-ts'
import { withSubscriptions } from 'raj-ts/lib/subscription'
import { Country, getCompleteCountries } from './country-data'

type Direction = 'forward' | Side
type Side = 'left' | 'right'
type Mode = 'easy' | 'medium' | 'hard'
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
  scene: 'home' | 'game' | 'key' | 'about'
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
  | { type: 'reset_game' }
  | { type: 'start_game'; mode: Mode }
  | { type: 'start_next_round' }
  | { type: 'clear_game_scene' }
  | { type: 'choose_path'; dir: Direction; side: Side }
  | { type: 'game_tick' }
  | { type: 'show_key' }
  | { type: 'show_about' }

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
;(window as any).$countries = allCountries

const hardLeftCountries = allCountries.filter((c) => c.side === 'left')
const hardRightCountries = allCountries.filter((c) => c.side === 'right')

const easyCountriesCodes = ['us', 'gb', 'ca', 'in']
const easyCountries = allCountries.filter((c) =>
  easyCountriesCodes.includes(c.id)
)

const easyLeftCountries = easyCountries.filter((c) => c.side === 'left')
const easyRightCountries = easyCountries.filter((c) => c.side === 'right')

const mediumCountryCodes = [
  'us',
  'gb',
  'in',
  'br',
  'jp',
  'fr',
  'au',
  'nz',
  'de',
  'es',
]

const mediumCountries = allCountries.filter((c) =>
  mediumCountryCodes.includes(c.id)
)

const mediumLeftCountries = mediumCountries.filter((c) => c.side === 'left')
const mediumRightCountries = mediumCountries.filter((c) => c.side === 'right')

function getSimpleSideIcon(side: Side): Icon {
  switch (side) {
    case 'left':
      return { label: 'Left', url: './left.svg' }
    case 'right':
      return { label: 'Right', url: './right.svg' }
  }
}

function getRandomEasyCountryIcon(side: Side): Icon {
  let country: Country
  switch (side) {
    case 'left':
      country = randomItem(easyLeftCountries)
      break
    case 'right':
      country = randomItem(easyRightCountries)
      break
  }

  return {
    label: country.name,
    url: country.imageUrl,
  }
}

function getRandomMediumCountryIcon(side: Side): Icon {
  let country: Country
  switch (side) {
    case 'left':
      country = randomItem(mediumLeftCountries)
      break
    case 'right':
      country = randomItem(mediumRightCountries)
      break
  }

  return {
    label: country.name,
    url: country.imageUrl,
  }
}

function getRandomHardCountryIcon(side: Side): Icon {
  let country: Country
  switch (side) {
    case 'left':
      country = randomItem(hardLeftCountries)
      break
    case 'right':
      country = randomItem(hardRightCountries)
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
      forwardIcon = getRandomEasyCountryIcon(forward)
      leftIcon = getRandomEasyCountryIcon(left)
      rightIcon = getRandomEasyCountryIcon(right)
      break
    case 'medium':
      forwardIcon = getRandomMediumCountryIcon(forward)
      leftIcon = getRandomMediumCountryIcon(left)
      rightIcon = getRandomMediumCountryIcon(right)
      break
    case 'hard':
      forwardIcon = getRandomHardCountryIcon(forward)
      leftIcon = getRandomHardCountryIcon(left)
      rightIcon = getRandomHardCountryIcon(right)
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

const init: Change<Msg, Model> = [
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
]

export const appProgram = withSubscriptions<Msg, Model, React.ReactNode>({
  init,
  update(msg, model) {
    switch (msg.type) {
      case 'reset_game': {
        return init
      }
      case 'show_key': {
        return [{ ...model, scene: 'key' }]
      }
      case 'show_about': {
        return [{ ...model, scene: 'about' }]
      }
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
      src="./car.svg"
      style={{ top: `${100 - progress}%` }}
    />
  )
}

function Road({
  dir,
  side,
  marker,
  dispatch,
  tutorial,
}: {
  dir: Direction
  side: Side
  marker: Model['roadMarker']
  dispatch: Dispatch<Msg>
  tutorial: boolean
}) {
  let content
  let className = 'road'
  if (marker) {
    const { way } = marker
    if (way === 'all' || (way.dir === dir && way.side === side)) {
      let src
      switch (marker.type) {
        case 'pass':
          src = './pass.svg'
          className += ' road--pass'
          break
        case 'fail':
          src = './fail.svg'
          className += ' road--fail'
          break
      }

      content = <img className="indicator" alt={marker.type} src={src} />
    }
  } else {
    className += ' road--interactive'
  }

  if (dir === 'forward') {
    className += ' road--narrow-width'
  }

  return (
    <td
      onClick={() => dispatch({ type: 'choose_path', dir, side })}
      className={className}
    >
      {tutorial ? <div className="road-pulse">{content}</div> : content}
    </td>
  )
}

function view(model: Model, dispatch: Dispatch<Msg>) {
  ;(window as any).$model = model
  if (model.scene === 'key') {
    return keyView(dispatch)
  }

  if (model.scene === 'about') {
    return aboutView(dispatch)
  }

  const tutorial =
    model.scene === 'game' && model.score === 0 && !model.roadMarker

  return (
    <div className="ground">
      <table className={model.transitioning ? 'spin-zone' : ''}>
        <tbody>
          <tr className="extra-top">
            <td className="grass"></td>
            <td className="road"></td>
            <td className="grass" />
            <td className="road"></td>
            <td className="grass"></td>
          </tr>
          <tr className="title-row">
            <td className="grass">
              <h1 className="title">
                {model.roadMarker?.type === 'fail' ? (
                  <button
                    className="text-inherit"
                    onClick={(e) => {
                      e.preventDefault()
                      dispatch({ type: 'reset_game' })
                    }}
                  >
                    Re:Turn
                  </button>
                ) : (
                  'Re:Turn'
                )}
              </h1>
            </td>
            <Road
              {...{
                dir: 'forward',
                side: 'left',
                marker: model.roadMarker,
                dispatch,
                tutorial,
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
                tutorial,
              }}
            />
            <td className="grass">
              {model.scene === 'game' && (
                <h3 className="mode-title">
                  {model.mode.charAt(0).toUpperCase() + model.mode.slice(1)}
                  <br />
                  mode
                </h3>
              )}
            </td>
          </tr>
          <tr>
            <Road
              {...{
                dir: 'left',
                side: 'right',
                marker: model.roadMarker,
                dispatch,
                tutorial,
              }}
            />
            <td className="road" colSpan={3} />
            <Road
              {...{
                dir: 'right',
                side: 'left',
                marker: model.roadMarker,
                dispatch,
                tutorial,
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
            <td className="road" colSpan={3}>
              {model.roadMarker?.type === 'fail' ? (
                <p className="instruction">
                  {model.roadMarker.way === 'all' ? 'Too late!' : 'Wrong way!'}
                  <br />
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      dispatch({ type: 'start_game', mode: model.mode })
                    }}
                    className="text-inherit"
                  >
                    Replay?
                  </button>
                </p>
              ) : model.scene === 'game' && model.instruction === 'forward' ? (
                <p className="instruction">
                  Go
                  <br />
                  <b>Forward</b>
                </p>
              ) : (
                <p className="instruction">
                  Turn
                  <br />
                  <b>{model.instruction === 'left' ? 'Left' : 'Right'}</b>
                </p>
              )}
            </td>
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
                tutorial,
              }}
            />
            <td className="road" colSpan={3} />
            <Road
              {...{
                dir: 'right',
                side: 'right',
                marker: model.roadMarker,
                dispatch,
                tutorial,
              }}
            />
          </tr>
          <tr className="drive-up">
            <td className="grass">
              {model.scene === 'home' ? (
                <div className="modes">
                  <label>Play modes</label>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      dispatch({ type: 'start_game', mode: 'easy' })
                    }}
                  >
                    Easy
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      dispatch({ type: 'start_game', mode: 'medium' })
                    }}
                  >
                    Medium
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      dispatch({ type: 'start_game', mode: 'hard' })
                    }}
                  >
                    Hard
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
                <>
                  <div className="modes">
                    <label>Context</label>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        dispatch({ type: 'show_about' })
                      }}
                    >
                      About
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        dispatch({ type: 'show_key' })
                      }}
                    >
                      Flags
                    </button>
                  </div>
                </>
              ) : (
                <p className="score score--high">
                  High
                  <br />
                  <b>{model.highScore}</b>
                </p>
              )}
            </td>
          </tr>
          <tr className="extra-bottom">
            <td className="grass"></td>
            <td className="road"></td>
            <td className="grass" />
            <td className="road"></td>
            <td className="grass"></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function Page({
  children,
  onClose,
}: React.PropsWithChildren<{ onClose: () => void }>) {
  return (
    <div className="fullscreen-page">
      <div className="fullscreen-header">
        <div className="about-container">
          <b>Re:Turn</b>
          <button
            className="text-inherit"
            onClick={(e) => {
              e.preventDefault()
              onClose()
            }}
          >
            Return to game
          </button>
        </div>
      </div>
      <div className="scrollable-view">
        <div className="about">
          {children}
          <p>
            <button
              onClick={(e) => {
                e.preventDefault()
                onClose()
              }}
            >
              Return to game
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function aboutView(dispatch: Dispatch<Msg>) {
  return (
    <Page onClose={() => dispatch({ type: 'reset_game' })}>
      <h2>What's this?</h2>
      <p>
        Welcome to the most hazardous intersection on the internet where the
        correct way isn't just left or right or straight ahead, it's also which
        side of the road to drive on!
      </p>

      <p>
        Review the{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            dispatch({ type: 'show_key' })
          }}
        >
          country key
        </a>{' '}
        for great success.
      </p>

      <p>
        Made by <a href="https://jew.ski">Chris Andrejewski</a>
      </p>
    </Page>
  )
}

function keyView(dispatch: Dispatch<Msg>) {
  return (
    <Page onClose={() => dispatch({ type: 'reset_game' })}>
      <h2>Country key</h2>
      <p>Here's the list of countries and their dominant driving side.</p>

      <ModeCountryList
        {...{
          title: 'Easy mode countries',
          countries: easyCountries,
        }}
      />

      <ModeCountryList
        {...{
          title: 'Medium mode countries',
          countries: mediumCountries,
        }}
      />

      <ModeCountryList
        {...{
          title: 'Hard mode countries',
          countries: allCountries,
        }}
      />
    </Page>
  )
}

function ModeCountryList({
  title,
  countries,
}: {
  title: string
  countries: Country[]
}) {
  return (
    <>
      <h3>{title}</h3>
      <table style={{ width: '100%' }}>
        <tbody>
          {countries
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <tr key={c.id}>
                <td style={{ width: '100%' }}>
                  <b>{c.name}</b>
                  <br />
                  {c.side === 'left'
                    ? 'Drive on the left-hand side'
                    : 'Drive on the right-hand side'}
                </td>
                <td>
                  <Indicator
                    {...{ icon: { label: c.name, url: c.imageUrl } }}
                  />
                </td>
                <td>
                  <Indicator {...{ icon: getSimpleSideIcon(c.side) }} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  )
}
