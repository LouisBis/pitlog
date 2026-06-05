import log from 'loglevel'

const level = import.meta.env.VITE_LOG_LEVEL ?? 'warn'
log.setLevel(level as log.LogLevelDesc)

export default log
