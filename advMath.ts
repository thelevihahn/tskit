// NOTE/FIX: A lot of this geometrical math only works on MCA's coordinate system


interface Vector2 {
    x: number,
    y: number
}


namespace Vector2 {
    interface Readonly {
        readonly x: number
        readonly y: number
    }
    export const right: Readonly = { x: 1, y: 0 }
    export const left: Readonly = { x: -1, y: 0 }
    export const down: Readonly = { x: 0, y: 1 }
    export const up: Readonly = { x: 0, y: -1 }
    export const rightDown: Readonly = { x: 1, y: 1 }
    export const rightUp: Readonly = { x: 1, y: -1 }
    export const leftDown: Readonly = { x: -1, y: 1 }
    export const leftUp: Readonly = { x: -1, y: -1 }
    export const zero: Readonly = { x: 0, y: 0 }

    export function create(x = 0, y = 0): Vector2 {
        return { x, y }
    }

    export function clone(v: Vector2): Vector2 {
        return { x: v.x, y: v.y }
    }

    export function equals(a: Vector2, b: Vector2): boolean {
        return a.x === b.x && a.y === b.y
    }

    export function equalsApprox(
        a: Vector2,
        b: Vector2,
        tolerance: number
    ): boolean {
        return (
            Math.abs(a.x - b.x) <= tolerance &&
            Math.abs(a.y - b.y) <= tolerance
        )
    }

    export function equalsApproxRaw(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        tolerance: number
    ): boolean {
        return (
            Math.abs(x1 - x2) <= tolerance &&
            Math.abs(y1 - y2) <= tolerance
        )
    }

    export function multiply(v: Vector2, by: number): Vector2 {
        return {
            x: v.x * by,
            y: v.y * by
        }
    }

    export function add(a: Vector2, b: Vector2): Vector2 {
        return {
            x: a.x + b.x,
            y: a.y + b.y
        }
    }
    export function subtract(a: Vector2, b: Vector2): Vector2 {
        return {
            x: a.x - b.x,
            y: a.y - b.y
        }
    }

    export function magnitude(v: Vector2): number {
        return magnitudeRaw(v.x, v.y)
    }
    export function magnitudeRaw(x: number, y: number): number {
        return Math.sqrt(x ** 2 + y ** 2)
    }

    function magnitudeSquared(a: Vector2, b: Vector2): number {
        const dx = a.x - b.x
        const dy = a.y - b.y
        return dx * dx + dy * dy
    }

    export function cross(
        a: Vector2,
        b: Vector2,
        orientation: Sign = 1
    ): number {
        return crossRaw(a.x, a.y, b.x, b.y, orientation)
    }
    export function crossRaw(
        ax: number,
        ay: number,
        bx: number,
        by: number,
        orientation: Sign = 1
    ): number {
        return orientation * (ax * by - ay * bx)
    }

    export function dot(
        a: Vector2,
        b: Vector2
    ): number {
        return dotRaw(a.x, a.y, b.x, b.y)
    }
    export function dotRaw(
        ax: number,
        ay: number,
        bx: number,
        by: number
    ): number {
        return ax * bx + ay * by
    }

    export function sign(v: Vector2): Vector2 {
        return { x: Math.sign(v.x), y: Math.sign(v.y) }
    }

    export function normalized(v: Vector2): Vector2 {
        const mag = magnitude(v)
        if (mag === 0) return { x: 0, y: 0 }
        return { x: v.x / mag, y: v.y / mag }
    }
    export function normalizedRaw(x: number, y: number): [number, number] {
        const magnitude = magnitudeRaw(x, y)
        if (magnitude === 0) return [0, 0]
        return [x / magnitude, y / magnitude]
    }

    export function normalizedSum(normals: Vector2[]): Vector2 {
        let combined = {
            x: 0,
            y: 0
        }

        for (const normal of normals) {
            combined.x += normal.x
            combined.y += normal.y
        }

        return Vector2.normalized(combined)
    }
    export function applyNormalize(v: Vector2): void {
        const mag = magnitude(v)
        if (mag === 0) {
            v.x = 0
            v.y = 0
        } else {
            v.x /= mag
            v.y /= mag
        }
    }
    export function reversed(v: Vector2): Vector2 {
        return { x: v.x * -1, y: v.y * -1 }
    }

    export function toStringRaw(x: number, y: number): string {
        return `${x},${y}`
    }
    export function toString(v: Vector2): string {
        return toStringRaw(v.x, v.y)
    }

    export function toLog(v: Vector2): string {
        return `(${v.x}, ${v.y})`
    }
    export function toLogs(v: Vector2[]): string {
        let logs = ""
        for (const vertex of v) {
            logs = logs.concat(`${toLog(vertex)} `)
        }
        return logs
    }
    export type Direction =
        | "right" | "left" | "up"
        | "down" | "rightUp" | "leftUp"
        | "rightDown" | "leftDown"
        ;
    export function toDirectionString(v: Vector2): Direction {
        const x = Math.sign(v.x), y = Math.sign(v.y)
        if (x === 0 && y === 0) return "down"
        const hDir = x === 1 ? "right" : x === -1 ? "left" : ""
        let vDir = y === 1 ? "down" : y === -1 ? "up" : ""
        if (hDir !== "" && vDir !== "")
            vDir = vDir.charAt(0).toUpperCase() + vDir.slice(1)
        return (hDir + vDir || "down") as Direction
    }
}

interface Segment {
    start: Vector2
    end: Vector2
    vector: Vector2
    length: number
    lengthSquared: number
    bounds: AABB
    sign: number // what is this for?
}
namespace Segment {
    const EPSILON = 0.001

    // Optimized
    export function create(
        start: Vector2,
        end: Vector2
    ): Segment {

        const dx = end.x - start.x
        const dy = end.y - start.y

        const lengthSquared =
            dx ** 2 +
            dy ** 2

        return {
            start,
            end,

            vector: {
                x: dx,
                y: dy
            },

            length: Math.sqrt(lengthSquared),

            lengthSquared,

            bounds: {
                min: Vector2.create(Math.min(start.x, end.x), Math.min(start.y, end.y)),
                max: Vector2.create(Math.max(start.x, end.x), Math.max(start.y, end.y))
            },
            sign: Math.sign(dy)
        }
    }

    export function pointAt(segment: Segment, along: number): Vector2 {
        return {
            x: segment.start.x + segment.vector.x * along,
            y: segment.start.y + segment.vector.y * along
        }
    }

    export function getAlong(
        segment: Segment,
        point: Vector2
    ): number {
        const dx = point.x - segment.start.x
        const dy = point.y - segment.start.y

        return (
            dx * segment.vector.x +
            dy * segment.vector.y
        ) / segment.lengthSquared
    }

    // consider rename
    export function containsPoint(
        point: Vector2,
        edge: Segment
    ): boolean {

        const along =
            getAlong(edge, point)

        if (
            along < -EPSILON ||
            along > 1 + EPSILON
        ) {
            return false
        }

        const projected =
            pointAt(
                edge,
                along
            )

        return (
            Math.abs(
                projected.x - point.x
            ) <= EPSILON &&
            Math.abs(
                projected.y - point.y
            ) <= EPSILON
        )
    }
    // Optimized: Could be in a segment math namespace
    export function getRayIntersection(
        rayStart: Vector2,
        rayDirection: Vector2,
        segment: Segment
    ): number | undefined {

        const toSegmentX = segment.start.x - rayStart.x
        const toSegmentY = segment.start.y - rayStart.y

        const cross =
            rayDirection.x * segment.vector.y -
            rayDirection.y * segment.vector.x

        if (Math.abs(cross) <= EPSILON) {
            return undefined
        }

        const t =
            (
                toSegmentX * segment.vector.y -
                toSegmentY * segment.vector.x
            ) / cross

        if (t < 0) {
            return undefined
        }

        const u =
            (
                toSegmentX * rayDirection.y -
                toSegmentY * rayDirection.x
            ) / cross

        if (u < 0 || u > 1) {
            return undefined
        }

        return t
    }

    export enum Side {
        Left,
        Right
    }

    // Optimized
    export function getNormal(
        segment: Segment,
        side: Sign
    ): Vector2 {
        return {
            x: segment.vector.y * side / segment.length,
            y: -segment.vector.x * side / segment.length
        }
    }

    // Optimized: Could be it's own segment Math
    export function getNormals(
        segments: Segment[],
        side: Sign
    ): Vector2[] {

        const normals: Vector2[] = []

        for (const segment of segments) {
            normals.push(getNormal(segment, side))
        }
        return normals
    }

    export function toLog(segment: Segment): string {
        const vertices = `Vertices: ${Vector2.toLog(segment.start)} -> ${Vector2.toLog(segment.end)}`
        const vector = ` | Vector: ${Vector2.toLog(segment.vector)}`
        const length = ` | length: ${segment.length}, lengthSquared: ${segment.lengthSquared}`
        const sign = ` | Sign: ${segment.sign}`
        const bounds = " | Bounds; " + AABB.toLog(segment.bounds)
        return vertices + vector + length + bounds
    }
}

interface Edge extends Segment {
    index: number
    startIndex: number
    endIndex: number
    normal: Vector2
}
namespace Edge {

    enum Winding {
        Clockwise,
        CounterClockwise
    }
    export function getWinding(edges: Edge[]): Winding {

        let area = 0

        for (const edge of edges) {
            area +=
                edge.start.x * edge.end.y -
                edge.end.x * edge.start.y
        }

        return area < 0
            ? Winding.Clockwise
            : Winding.CounterClockwise
    }

    export function create(
        start: Vector2,
        end: Vector2,
        startIndex: number,
        endIndex: number,
        index: number,
        winding: Winding = Winding.Clockwise
    ): Edge {
        const segment = Segment.create(start, end)
        return {
            start: segment.start,
            end: segment.end,
            vector: segment.vector,
            length: segment.length,
            lengthSquared: segment.lengthSquared,
            bounds: segment.bounds,
            sign: segment.sign,
            index,
            startIndex,
            endIndex,
            normal: Segment.getNormal(
                segment,
                winding === Winding.Clockwise
                    ? -1
                    : 1
            )
        }
    }

    export function clone(edge: Edge, start: Vector2, end: Vector2): Edge {
        //const start = startRef === undefined ? Vector2.clone(edge.start) : startRef
        //const end = endRef === undefined ? Vector2.clone(edge.end) : endRef
        //const vector = {x: end.x - start.x,y: end.y - start.y}

        const newEdge = {
            start,
            end,
            vector: Vector2.clone(edge.vector),
            length: edge.length,
            lengthSquared: edge.lengthSquared,
            bounds: AABB.clone(edge.bounds),
            sign: edge.sign,
            index: edge.index,
            startIndex: edge.startIndex,
            endIndex: edge.endIndex,
            normal: Vector2.clone(edge.normal)
        }
        return newEdge
    }

    export function createFromVertices(
        vertices: Vector2[]
    ): Edge[] {

        const edges: Edge[] = []

        for (let i = 0; i < vertices.length; i++) {
            const startIndex = i
            const endIndex = (i + 1) % vertices.length

            edges.push(
                create(
                    vertices[startIndex],
                    vertices[endIndex],
                    startIndex,
                    endIndex,
                    startIndex
                )
            )
        }

        return edges
    }
    export function reverse(edge: Edge): Edge {
        return {
            index: edge.index,
            start: edge.end,
            end: edge.start,

            vector: {
                x: -edge.vector.x,
                y: -edge.vector.y
            },

            startIndex: edge.endIndex,
            endIndex: edge.startIndex,
            length: edge.length,
            lengthSquared: edge.lengthSquared,
            bounds: edge.bounds,
            sign: -edge.sign,

            normal: {
                x: -edge.normal.x,
                y: -edge.normal.y
            }
        }
    }
    export function toLog(edge: Edge): string {
        const segmentInfo = Segment.toLog(edge)

        const index = ` | StartIndex: ${edge.startIndex}, EndIndex: ${edge.endIndex}`
        const normal = ` | Normal: ${Vector2.toLog(edge.normal)}`
        return segmentInfo + index + normal
    }
    export function toLogs(edges: Edge[]): string {
        let logs = ""
        for (const edge of edges) {
            logs = logs.concat(toLog(edge))
        }

        return logs
    }
}
type PointGroup = {
    direction: Vector2
    points: Vector2[]
}

type PolyBounds = AABB & {
    boundPoints: PointGroup[]
}
interface Polygon {
    vertices: Vector2[]
    origin: Vector2
    edges: Edge[]
    bounds: PolyBounds
}
namespace Polygon {

    // POLYGON CREATION 

    /**
     * Creates a regular convex polygon centered at the origin.
     * Vertices are evenly distributed around the given radius.
     * Defaults to an upward-facing orientation.
     */
    const UP_ANGLE: number = -Math.PI / 2
    export function create(
        sides: number,
        radius: number,
        rotation?: number,
        origin: Vector2 = null
    ): Polygon {
        if (rotation === undefined) {
            rotation = UP_ANGLE
        }

        const verticies: Vector2[] = []

        const angleStep = (Math.PI * 2) / sides

        for (let i = 0; i < sides; i++) {
            const angle = rotation + i * angleStep

            verticies.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            })
        }

        return createFromVertices(verticies, origin)
    }

    /**
     * Creates a polygon from an array of vertices.
     * Vertices are connected in the order provided,
     * regardless of their positions.
     *
     * Winding direction is determined by vertex order.
     * Can create concave or self-intersecting polygons.
     */
    export function createFromVertices(vertices: Vector2[], origin: Vector2 = null): Polygon {
        const edges = Edge.createFromVertices(vertices)
        const bounds = getBounds(vertices)
        if (!origin) origin = { x: 0, y: 0 }
        return { vertices, origin, edges, bounds }
    }

    export function clone(polygon: Polygon): Polygon {
        let vertices: Vector2[] = []
        for (let v = 0; v < polygon.vertices.length; v++) {
            const vertex = polygon.vertices[v]
            vertices[v] = { x: vertex.x, y: vertex.y }
        }
        let edges: Edge[] = []
        for (let e = 0; e < polygon.edges.length; e++) {
            const edge = polygon.edges[e]
            edges.push(Edge.clone(edge, vertices[edge.startIndex], vertices[edge.endIndex]))
        }

        const bounds = getBounds(vertices)
        const origin = Vector2.clone(polygon.origin)

        //return polygon
        return { vertices, origin, edges, bounds }
    }

    export function createTriangle(
        width: number = 16,
        height: number = 16,
        origin: Vector2 = null
    ): Polygon {
        const w = width / 2
        const h = height / 2

        return createFromVertices([
            { x: 0, y: -h },
            { x: w, y: h },
            { x: -w, y: h }
        ], origin)
    }

    export function createRectangle(
        width: number = 16,
        height: number = 16,
        origin: Vector2 = null
    ): Polygon {
        const w = width / 2
        const h = height / 2

        return createFromVertices([
            { x: -w, y: -h },
            { x: w, y: -h },
            { x: w, y: h },
            { x: -w, y: h }
        ], origin)
    }

    export function createOctagon(
        width: number = 16,
        height: number = 16,
        cut: number = 3,
        origin: Vector2 = null
    ): Polygon {

        const w = width / 2
        const h = height / 2

        return createFromVertices([
            { x: -w + cut, y: -h },
            { x: w - cut, y: -h },
            { x: w, y: -h + cut },
            { x: w, y: h - cut },
            { x: w - cut, y: h },
            { x: -w + cut, y: h },
            { x: -w, y: h - cut },
            { x: -w, y: -h + cut }
        ], origin)
    }

    // POLYGON BOUNDS 



    export function getBounds(vertices: Vector2[]): PolyBounds {
        let minX = vertices[0].x
        let maxX = vertices[0].x
        let minY = vertices[0].y
        let maxY = vertices[0].y

        let minXPoints = [vertices[0]]
        let maxXPoints = [vertices[0]]
        let minYPoints = [vertices[0]]
        let maxYPoints = [vertices[0]]

        for (let i = 1; i < vertices.length; i++) {
            const point = vertices[i]

            if (point.x < minX) {
                minX = point.x
                minXPoints = [point]
            } else if (point.x == minX) {
                minXPoints.push(point)
            }

            if (point.x > maxX) {
                maxX = point.x
                maxXPoints = [point]
            } else if (point.x == maxX) {
                maxXPoints.push(point)
            }

            if (point.y < minY) {
                minY = point.y
                minYPoints = [point]
            } else if (point.y == minY) {
                minYPoints.push(point)
            }

            if (point.y > maxY) {
                maxY = point.y
                maxYPoints = [point]
            } else if (point.y == maxY) {
                maxYPoints.push(point)
            }
        }

        const min = Vector2.create(minX, minY)
        const max = Vector2.create(maxX, maxY)
        return {
            min,
            max,

            boundPoints: [
                {
                    direction: { x: -1, y: 0 },
                    points: minXPoints
                },
                {
                    direction: { x: 1, y: 0 },
                    points: maxXPoints
                },
                {
                    direction: { x: 0, y: -1 },
                    points: minYPoints
                },
                {
                    direction: { x: 0, y: 1 },
                    points: maxYPoints
                }
            ]
        }
    }

    // POLYGON OPERATIONS

    export function getWidth(vertices: Vector2[]): number {
        let minX = Infinity
        let maxX = -Infinity

        for (const vertex of vertices) {
            minX = Math.min(minX, vertex.x)
            maxX = Math.max(maxX, vertex.x)
        }

        return maxX - minX
    }

    export function getHeight(vertices: Vector2[]): number {
        let minY = Infinity
        let maxY = -Infinity

        for (const vertex of vertices) {
            minY = Math.min(minY, vertex.y)
            maxY = Math.max(maxY, vertex.y)
        }

        return maxY - minY
    }

    export function getArea(vertices: Vector2[]): number {
        let area = 0

        for (let i = 0; i < vertices.length; i++) {
            const a = vertices[i]
            const b = vertices[
                (i + 1) % vertices.length
            ]

            area +=
                a.x * b.y -
                b.x * a.y
        }

        return Math.abs(area) * 0.5
    }

    export function getDepth(
        verticesA: Vector2[],
        verticesB: Vector2[],
        direction: Vector2
    ): number {
        let minA =
            Vector2.dot(
                verticesA[0],
                direction
            )

        let maxB =
            Vector2.dot(
                verticesB[0],
                direction
            )

        for (let i = 1; i < verticesA.length; i++) {

            const projection =
                Vector2.dot(
                    verticesA[i],
                    direction
                )

            if (projection < minA) {
                minA = projection
            }
        }

        for (let i = 1; i < verticesB.length; i++) {

            const projection =
                Vector2.dot(
                    verticesB[i],
                    direction
                )

            if (projection > maxB) {
                maxB = projection
            }
        }


        return Math.abs(maxB - minA)
    }

    // TRANSLATE OPERATIONS

    /**
     * translates/mutates a polygon to a position
     */
    export function translateTo(polygon: Polygon, position: Vector2) {
        const delta = Vector2.subtract(position, polygon.origin)
        translate(polygon, delta)
    }

    /**
     * translates/mutates a polygon by a delta
     */
    export function translate(polygon: Polygon, delta: Vector2) {
        polygon.origin.x += delta.x
        polygon.origin.y += delta.y

        for (let vertex of polygon.vertices) {
            vertex.x += delta.x
            vertex.y += delta.y
        }

        for (let edge of polygon.edges) {
            edge.bounds.min.x += delta.x
            edge.bounds.max.x += delta.x
            edge.bounds.min.y += delta.y
            edge.bounds.max.y += delta.y
        }

        const bounds = polygon.bounds

        bounds.min.x += delta.x
        bounds.max.x += delta.x
        bounds.min.y += delta.y
        bounds.max.y += delta.y
    }

    /**
     * Returns a new polygon translated by a delta
     */
    export function translated(polygon: Polygon, delta: Vector2): Polygon {
        const newPolygon = clone(polygon)
        translate(newPolygon, delta)
        return newPolygon
    }
    /**
     * Returns a new polygon translated to a position
     */
    export function translatedTo(polygon: Polygon, position: Vector2): Polygon {
        const newPolygon = clone(polygon)
        translateTo(newPolygon, position)
        return newPolygon
    }

    // LOG OPERATIONS

    export function boundsToLog(shapeName: string, thisBounds: PolyBounds): string {
        let log = "BoundingBox " + shapeName

        const aabb = `| min: ${Vector2.toLog(thisBounds.min)} | max: ${Vector2.toLog(thisBounds.max)}`
        let logs = ``
        for (let i = 0; i < thisBounds.boundPoints.length; i++) {
            logs = logs.concat(`
            Direction: ${Vector2.toLog(thisBounds.boundPoints[i].direction)}`)
            let data = ""
            for (let j = 0; j < thisBounds.boundPoints[i].points.length; j++) {
                const bound = thisBounds.boundPoints[i]
                data = data.concat(`
                point[${j}]: ${Vector2.toString(bound.points[j])}`)
            }
        }
        log = log.concat(logs)
        return log
    }

    export function toLog(polygon: Polygon): string {
        const vertices = " Vertices: " + Vector2.toLogs(polygon.vertices)
        const origin = " | origin: " + Vector2.toLog(polygon.origin)
        const edges = " | Edges: " + Edge.toLogs(polygon.edges)
        const bounds = " | Bounds: " + AABB.toLog(polygon.bounds)
        return vertices + origin + edges + bounds
    }
}
interface AABB {
    min: Vector2
    max: Vector2
}
namespace AABB {
    export function clone(bounds: AABB): AABB {
        return {
            min: { x: bounds.min.x, y: bounds.min.y },
            max: { x: bounds.max.x, y: bounds.max.y }
        }
    }
    export function toLog(bounds: AABB): string {
        return `min: ${Vector2.toLog(bounds.min)}, max: ${Vector2.toLog(bounds.max)}`
    }

    export function isOverlapping(a: AABB, b: AABB): boolean {
        return (
            a.min.x <= b.max.x &&
            a.max.x >= b.min.x &&
            a.min.y <= b.max.y &&
            a.max.y >= b.min.y
        )
    }
}
interface Circle {
    center: Vector2
    radius: number
}
namespace Circle {
    export function create(center: Vector2, radius: number): Circle {
        return {
            center,
            radius
        }
    }

    export function containsPoint(circle: Circle, point: Vector2): boolean {
        const dx = point.x - circle.center.x
        const dy = point.y - circle.center.y

        return dx ** 2 + dy ** 2 <= circle.radius ** 2
    }

    export function intersects(a: Circle, b: Circle): boolean {
        const dx = b.center.x - a.center.x
        const dy = b.center.y - a.center.y
        const radius = a.radius + b.radius

        return dx ** 2 + dy ** 2 <= radius ** 2
    }

    export function getMidpoint(a: Circle, b: Circle): Vector2 | null {
        const dx = b.center.x - a.center.x
        const dy = b.center.y - a.center.y

        const distanceSquared = dx ** 2 + dy ** 2
        const radius = a.radius + b.radius
        if (distanceSquared > radius ** 2) {
            return null
        }

        return {
            x: (a.center.x + b.center.x) / 2,
            y: (a.center.y + b.center.y) / 2
        }
    }

    export function getPenetration(a: Circle, b: Circle): number {
        const dx = b.center.x - a.center.x
        const dy = b.center.y - a.center.y

        const distance = Math.sqrt(dx * dx + dy * dy)

        return Math.max(0, a.radius + b.radius - distance)
    }
    function getPoints(radius: number): Vector2[] {
        const points: Vector2[] = []

        for (let angle = 0; angle < 360; angle++) {
            const radians = angle * Math.PI / 180

            points.push({
                x: Math.cos(radians) * radius,
                y: Math.sin(radians) * radius
            })
        }

        return points
    }
    export function getNormal(
        a: Circle,
        b: Circle
    ): Vector2 {

        const dx = b.center.x - a.center.x
        const dy = b.center.y - a.center.y

        const distance = Math.sqrt(dx ** 2 + dy ** 2)
        if (distance === 0) {
            return { x: 1, y: 0 }
        }

        return {
            x: dx / distance,
            y: dy / distance
        }
    }

    export function getBounds(circle: Circle): AABB {
        return {
            min: {
                x: circle.center.x - circle.radius,
                y: circle.center.y - circle.radius
            },
            max: {
                x: circle.center.x + circle.radius,
                y: circle.center.y + circle.radius
            }
        }
    }
}

