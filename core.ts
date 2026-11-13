
// TYPES
type Key = number | string
type Identity = Key | object
type Primitive = number | string | boolean | null
type Sign = 1 | -1

interface Dictionary<T> {
    [key: string]: T
}
interface ManagedReference<T> {
    value: T | undefined
}
interface ValidityProvider<T> {
    isValid(object: T): boolean
}
interface CoordinateConfig {
    originX: number
    originY: number
    axisX: Sign
    axisY: Sign
}

namespace Coordinates {
    export function getOrientation(config: CoordinateConfig): Sign {
        return (config.axisX * config.axisY) as Sign
    }
}
namespace Object {

    /**
     * EXPERIMENTAL
     *
     * Returns a deep clone of a value.
     * Recursively clones arrays and objects, including their nested values.
     *
     * Does not preserve shared references or support circular references.
     */
    export function deepClone<T>(value: T): T {
        const originals: any[] = []
        const clones: any[] = []

        return <T><any>cloneRecursive(value, originals, clones)
    }

    export function isObject(value: any): boolean {
        return value !== undefined && value !== null && typeof value === "object"
    }
    
    function cloneRecursive(
        value: any,
        originals: any[],
        clones: any[]
    ): any {
        if (value === null || typeof value !== "object") {
            return value
        }

        // Return an existing clone if this object was already visited.
        for (let i = 0; i < originals.length; i++) {
            if (originals[i] === value) {
                return clones[i]
            }
        }

        let result: any

        if (Array.isArray(value)) {
            result = []
        } else {
            result = {}
        }

        // Register before cloning children to handle circular references.
        originals.push(value)
        clones.push(result)

        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                result.push(cloneRecursive(value[i], originals, clones))
            }
        } else {
            const keys = Object.keys(value)

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                result[key] = cloneRecursive(value[key], originals, clones)
            }
        }

        return result
    }
}

namespace Identity {

    export const uidTag = "__UID"
    export type UID = number & {
        _brand: "IdentityID"
    }

    interface Entry { __UID?: UID | null }

    let nextUID = 0
    function generateUID(): UID {
        return nextUID++ as UID
    }

    let entries: Dictionary<object | Primitive> = {}

    function isValid(key: Key | null | undefined): boolean {
        return key !== undefined && key !== null
    }

    function isRegistered(id: UID): boolean {
        return entries[id] !== undefined
    }

    function isObjectRegistered(obj: object): boolean {
        const entry = obj as object & Entry
        const uid = entry[uidTag]

        return isValid(uid) && entries[uid] === obj
    }

    export function register(value: any): UID {
        if (Object.isObject(value)) {
            const obj = value as object & Entry
            const uid = obj[uidTag]

            if (isValid(uid) && entries[uid] === obj) {
                return uid
            }

            obj[uidTag] = generateUID()

            entries[obj[uidTag]] = obj
            return obj[uidTag]
        }
        const uid = generateUID()
        entries[uid] = value
        return uid
    }

    export function unregister(id: UID) {
        if (!isRegistered(id)) {
            return
        }

        const value = entries[id]
        if (Object.isObject(value)) {
            const obj = value as object & Entry
            if (obj[uidTag] === id) {
                obj[uidTag] = null
            }
        }

        delete entries[id]
    }

    export function getID(obj: object): UID | undefined | null {
        return (obj as Entry)[uidTag]
    }

    export function getValue(id: Identity): any {
        if (Object.isObject(id)) {
            const objectID = (id as Entry)[uidTag]

            if (!isValid(objectID)) return undefined
            return entries[objectID]
        }
        const key = id as Key
        return entries[key]
    }
}
namespace Time {
    export let Log = false
    export let deltaMillis = 0
    export let delta = 0
    export let updates = 0
    export let updateStart = 0
    export let lastReport = updates

    // Microseconds
    export let microsBits = 30
    export let microsMax = 2 ** microsBits - 1
    export let microsRollOver = microsMax + 1

    export interface Profile {
        name: string

        // per call 
        start: number
        minMicrosPerCall: number
        maxMicrosPerCall: number

        // this update
        callsThisUpdate: number
        microsThisUpdate: number
        iterationsThisUpdate: number

        // per update
        minCalls: number
        maxCalls: number
        minMicrosPerUpdate: number
        maxMicrosPerUpdate: number
        minIterationsPerUpdate: number
        maxIterationsPerUpdate: number

        // totals
        totalUpdates: number
        totalCalls: number
        totalMicros: number
        totalIterations: number
    }

    export let profiles: Dictionary<Profile> = {}
    export function createProfile(name: string): Profile {
        return {
            name: name,
            start: 0,
            callsThisUpdate: 0,
            microsThisUpdate: 0,
            iterationsThisUpdate: 0,

            minMicrosPerCall: Infinity,
            maxMicrosPerCall: 0,

            totalUpdates: 0,
            totalCalls: 0,
            totalMicros: 0,
            totalIterations: 0,

            minCalls: Infinity,
            maxCalls: 0,
            minMicrosPerUpdate: Infinity,
            maxMicrosPerUpdate: 0,
            minIterationsPerUpdate: Infinity,
            maxIterationsPerUpdate: 0,
        }
    }
    export function getProfile(name: string): Profile {

        if (profiles[name]) return profiles[name]

        const profile: Profile = createProfile(name)

        profiles[name] = profile
        return profile
    }

    export function countIterations(name: string, count: number) {
        getProfile(name).iterationsThisUpdate += count
    }

    export function resetProfile() {
        profiles = {}
    }
    export function update(deltaMillisP: number, deltaP: number) {
        deltaMillis = deltaMillisP
        delta = deltaP
    }
    export function reportProfiles(timeMillis: number): string | undefined {
        if (!Log) return undefined
        let logs = ""
        const keys = Object.keys(profiles)
        for (let key of keys) {
            const profile = profiles[key]
            const profileName = profile.name
            const perCall = " === Per Call" +
                " | Avg ms: " + profile.totalMicros / profile.totalCalls / 1000 +
                " | Min ms: " + profile.minMicrosPerCall / 1000 +
                " | Max ms: " + profile.maxMicrosPerCall / 1000
            const perUpdate = " === Per Update" +
                " | Avg Calls: " + profile.totalCalls / profile.totalUpdates +
                " | Min Calls: " + profile.minCalls +
                " | Max Calls: " + profile.maxCalls +
                " | Avg ms: " + profile.totalMicros / profile.totalUpdates / 1000 +
                " | Min ms: " + profile.minMicrosPerUpdate / 1000 +
                " | Max ms: " + profile.maxMicrosPerUpdate / 1000
            const log = `
            ${profileName} 
            ${perCall} 
            ${perUpdate}`
            logs = logs.concat(log)
        }
        lastReport = timeMillis
        return logs
    }

    export function startProfile(name: string, timeMicros: number) {
        let profile = getProfile(name)
        profile.callsThisUpdate++
        profile.start = timeMicros
    }

    export function endProfile(name: string, timeMicros: number) {
        let profile = getProfile(name)
        let elapsedMicros = timeMicros - profile.start

        // Handle timer wrapping around
        if (elapsedMicros < 0) {
            elapsedMicros += microsRollOver
        }
        if (elapsedMicros < profile.minMicrosPerCall || profile.minMicrosPerCall == 0) {
            profile.minMicrosPerCall = elapsedMicros
        }
        if (elapsedMicros > profile.maxMicrosPerCall) {
            profile.maxMicrosPerCall = elapsedMicros
        }
        profile.microsThisUpdate += elapsedMicros
        profile.start = 0
    }

    export function beginUpdate(timeMicros: number) {
        updateStart = timeMicros
        const keys = Object.keys(profiles)
        for (let key of keys) {
            const profile = profiles[key]
            profile.callsThisUpdate = 0
            profile.microsThisUpdate = 0
            profile.iterationsThisUpdate = 0
        }
    }
    export function endUpdate(timeMicros: number) {
        updates++
        const elapsedMicros = timeMicros - updateStart

        let duration = elapsedMicros
        if (duration < 0) {
            duration += microsRollOver
        }

        const keys = Object.keys(profiles)
        for (let key of keys) {
            const profile = profiles[key]
            profile.totalUpdates++

            const calls = profile.callsThisUpdate
            profile.totalCalls += calls
            if (calls < profile.minCalls) {
                profile.minCalls = calls
            }
            if (calls > profile.maxCalls) {
                profile.maxCalls = calls
            }

            const micros = profile.microsThisUpdate
            profile.totalMicros += micros
            if (micros < profile.minMicrosPerUpdate) {
                profile.minMicrosPerUpdate = micros
            }
            if (micros > profile.maxMicrosPerUpdate) {
                profile.maxMicrosPerUpdate = micros
            }

            const iterations = profile.iterationsThisUpdate
            profile.totalIterations += iterations
            if (iterations < profile.minIterationsPerUpdate) {
                profile.minIterationsPerUpdate = iterations
            }
            if (iterations > profile.maxIterationsPerUpdate) {
                profile.maxIterationsPerUpdate = iterations
            }
        }
    }

    export function isTimeToReport(timeMillis: number): boolean {
        return timeMillis - lastReport >= 1000
    }
}
