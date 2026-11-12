// Add your code here
let circles: Circle[] = []
let circleVs: Vector2[] = []
let rendered = 0
function MakeCircle() {
    let circle = Circle.create({ x: 1, y: 1 }, 2)
    circles.push(circle)
    circleVs.push(Vector2.create(20, 0))

    scene.createRenderable(0, () => {
        screen.setPixel(circle.center.x, circle.center.y, 1)
    })
    if (rendered >= 0) return
    rendered++
    scene.createRenderable(0, () => {
        for (let angle = 0; angle < 360; angle++) {
            const radians = angle * Math.PI / 180

            const x = circle.center.x + circle.radius * Math.cos(radians)
            const y = circle.center.y + circle.radius * Math.sin(radians)

            screen.setPixel(Math.floor(x), Math.floor(y), 1)
        }
    })
}



function CircleTest() {
    game.stats = true
    let count = 0
    const display = sprites.create(img`
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
    `)
    display.x = 100
    display.y = 40
    game.onUpdateInterval(500, function () {
        MakeCircle()
        count++
        display.sayText(count.toString())
    })

    const gravity = 300

    game.onUpdate(function () {
        const dt = control.eventContext().deltaTime

        for (let i = 0; i < circles.length; i++) {

            const circle = circles[i]
            const velocity = circleVs[i]

            velocity.y += gravity * dt

            const position = circle.center

            position.x += velocity.x * dt
            position.y += velocity.y * dt


        }
    })
    const iterations = 6
    game.onUpdate(function () {
        for (let iteration = 0; iteration < iterations; iteration++) {
            for (let i = 0; i < circles.length; i++) {
                const circle = circles[i]
                const velocity = circleVs[i]
                const position = circle.center

                // Screen boundaries
                if (position.x < circle.radius) {
                    position.x = circle.radius
                    if (velocity.x < 0) velocity.x *= -0.5
                }
                else if (position.x > 160 - circle.radius) {
                    position.x = 160 - circle.radius
                    if (velocity.x > 0) velocity.x *= -0.5
                }

                if (position.y < circle.radius) {
                    position.y = circle.radius
                    if (velocity.y < 0) velocity.y *= -0.5
                }
                else if (position.y > 120 - circle.radius) {
                    position.y = 120 - circle.radius
                    if (velocity.y > 0) velocity.y *= -0.5
                }

                // Circle collisions
                for (let j = i + 1; j < circles.length; j++) {
                    const otherCircle = circles[j]
                    const otherVelocity = circleVs[j]

                    const pen = Circle.getPenetration(circle, otherCircle)
                    if (pen <= 0) continue

                    const dir = Circle.getNormal(circle, otherCircle)
                    const correction = pen * 0.5

                    circle.center.x -= dir.x * correction
                    circle.center.y -= dir.y * correction
                    otherCircle.center.x += dir.x * correction
                    otherCircle.center.y += dir.y * correction

                    // Velocity response
                    const rvx = otherVelocity.x - velocity.x
                    const rvy = otherVelocity.y - velocity.y
                    const alongNormal = rvx * dir.x + rvy * dir.y

                    if (alongNormal < 0) {
                        const impulse = -(1 + 0.5) * alongNormal * 0.5

                        velocity.x -= impulse * dir.x
                        velocity.y -= impulse * dir.y

                        otherVelocity.x += impulse * dir.x
                        otherVelocity.y += impulse * dir.y
                    }
                }
            }
        }
    })
}

CircleTest()