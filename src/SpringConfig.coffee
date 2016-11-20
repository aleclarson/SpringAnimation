
fromOrigamiTensionAndFriction = (options) ->
  tension: tensionFromOrigamiValue options.tension
  friction: frictionFromOrigamiValue options.friction

fromBouncinessAndSpeed = (options) ->
  b = normalize options.bounciness / 1.7, 0, 20
  b = projectNormal b, 0, 0.8
  s = normalize options.speed / 1.7, 0, 20
  tension = projectNormal s, 0.5, 200
  friction = quadraticOutInterpolation b, (b3Nobounce tension), 0.01
  fromOrigamiTensionAndFriction tension, friction

module.exports = {
  fromOrigamiTensionAndFriction
  fromBouncinessAndSpeed
}

#
# Helpers
#

tensionFromOrigamiValue = (value) ->
  (value - 30) * 3.62 + 194

frictionFromOrigamiValue = (value) ->
  (value - 8) * 3 + 25

normalize = (value, startValue, endValue) ->
  (value - startValue) / (endValue - startValue)

projectNormal = (n, start, end) ->
  start + (n * (end - start))

linearInterpolation = (t, start, end) ->
  t * end + (1 - t) * start

quadraticOutInterpolation = (t, start, end) ->
  linearInterpolation 2 * t - t * t, start, end

b3Friction1 = (x) ->
  (0.0007 * Math.pow x, 3) -
  (0.006 * Math.pow x, 2) +
  (0.36 * x) + 2

b3Friction2 = (x) ->
  (0.000044 * Math.pow x, 3) -
  (0.006 * Math.pow x, 2) +
  (0.36 * x) + 2

b3Friction3 = (x) ->
  (0.00000045 * Math.pow x, 3) -
  (0.000332 * Math.pow x, 2) +
  (0.1078 * x) + 5.84

b3Nobounce = (tension) ->
  return b3Friction1 tension if tension <= 18
  return b3Friction2 tension if tension <= 44
  return b3Friction3 tension
