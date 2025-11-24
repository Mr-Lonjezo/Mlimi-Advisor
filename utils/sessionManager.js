class SessionManager {
    constructor() {
        this.sessions = new Map();
        console.log("✅ Session Manager initialized");
    }

    createSession(phoneNumber, sessionId) {
        const session = {
            phoneNumber,
            sessionId,
            currentMenu: 'main',
            previousMenu: null,
            userData: {},
            timestamp: Date.now()
        };
        this.sessions.set(sessionId, session);
        return session;
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (session) {
            Object.assign(session, updates);
            session.timestamp = Date.now();
        }
        return session;
    }

    deleteSession(sessionId) {
        this.sessions.delete(sessionId);
    }

    cleanupSessions(maxAge = 300000) {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.timestamp > maxAge) {
                this.sessions.delete(sessionId);
            }
        }
    }
}

module.exports = new SessionManager();