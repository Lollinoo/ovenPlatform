import { Stream } from "../schemas/stream.model.js";
import { User } from "../schemas/user.model.js";

/**
 * Servizio per la gestione degli stream RTMP
 */
class StreamService {
  /**
   * Crea o aggiorna un record di stream per un utente
   * @param {Object} userId - ID dell'utente
   * @param {String} username - Username dell'utente
   * @param {String} rtmpUrl - URL RTMP valido
   * @param {Date} rtmpUrlExpiresAt - Data di scadenza dell'URL RTMP
   * @returns {Promise<Object>} - Oggetto stream
   */
  async createOrUpdateStream(userId, username, rtmpUrl, rtmpUrlExpiresAt) {
    try {
      const streamRecord = await Stream.findOneAndUpdate(
        { userId },
        {
          username,
          rtmpUrl,
          rtmpUrlExpiresAt,
          isActive: false, // Inizialmente lo stream è inattivo
          streamKey: null,
        },
        { upsert: true, new: true }
      );

      return streamRecord;
    } catch (error) {
      console.error(
        "Errore nella creazione/aggiornamento dello stream:",
        error
      );
      throw error;
    }
  }

  /**
   * Attiva uno stream quando inizia la trasmissione
   * @param {String} streamName - Nome dello stream (username)
   * @param {String} sessionId - ID sessione dello stream
   * @returns {Promise<Object>} - Oggetto stream aggiornato
   */
  async activateStream(streamName, sessionId) {
    try {
      const streamRecord = await Stream.findOneAndUpdate(
        { username: streamName, isActive: false },
        {
          isActive: true,
          streamSessionId: sessionId,
          lastStreamStartedAt: new Date(),
        },
        { new: true }
      );

      return streamRecord;
    } catch (error) {
      console.error("Errore nell'attivazione dello stream:", error);
      throw error;
    }
  }

  /**
   * Disattiva uno stream quando termina la trasmissione
   * @param {String} streamName - Nome dello stream (username)
   * @param {String} sessionId - ID sessione dello stream
   * @returns {Promise<Object>} - Oggetto stream aggiornato
   */
  async deactivateStream(streamName, sessionId = null) {
    try {
      const query = { username: streamName, isActive: true };

      // Se è fornito l'ID sessione, assicurati che corrisponda
      if (sessionId) {
        query.streamSessionId = sessionId;
      }

      const streamRecord = await Stream.findOneAndUpdate(
        query,
        {
          isActive: false,
          lastStreamEndedAt: new Date(),
          streamSessionId: null,
        },
        { new: true }
      );

      return streamRecord;
    } catch (error) {
      console.error("Errore nella disattivazione dello stream:", error);
      throw error;
    }
  }

  /**
   * Verifica se uno stream è autorizzato in base all'URL RTMP e al nome dello stream
   * @param {String} rtmpUrl - URL RTMP da verificare
   * @param {String} streamName - Nome dello stream (username)
   * @returns {Promise<Object>} - Oggetto con stato di autorizzazione e dettagli
   */
  async isStreamAuthorized(rtmpUrl, streamName) {
    try {
      // Verifica che lo streamName corrisponda a un utente valido
      const user = await User.findOne({
        username: streamName,
        isVerified: true,
      });

      if (!user) {
        return {
          authorized: false,
          reason: "Invalid stream name or user not verified",
        };
      }

      // Verifica che l'URL RTMP corrisponda a quello associato all'utente
      const baseRtmpUrl = rtmpUrl.split("?")[0]; // Rimuovi parametri di query

      const stream = await Stream.findOne({
        userId: user._id,
        rtmpUrl: { $regex: baseRtmpUrl },
        rtmpUrlExpiresAt: { $gt: new Date() },
      });

      if (!stream) {
        return {
          authorized: false,
          reason: "Invalid or expired RTMP URL",
        };
      }

      // Verifica che non ci sia già uno stream attivo per questo utente
      const activeStream = await Stream.findOne({
        username: streamName,
        isActive: true,
      });

      if (activeStream) {
        return {
          authorized: false,
          reason: "Stream already active for this user",
        };
      }

      return {
        authorized: true,
        stream,
      };
    } catch (error) {
      console.error(
        "Errore nella verifica dell'autorizzazione dello stream:",
        error
      );
      return { authorized: false, reason: "Internal server error" };
    }
  }

  /**
   * Ottiene informazioni su tutti gli stream attivi
   * @returns {Promise<Array>} - Array di oggetti stream
   */
  async getActiveStreams() {
    try {
      const activeStreams = await Stream.find({ isActive: true });
      return activeStreams;
    } catch (error) {
      console.error("Errore nel recupero degli stream attivi:", error);
      throw error;
    }
  }

  /**
   * Aggiorna le statistiche di uno stream nel database
   * @param {String} streamName - Nome dello stream (username)
   * @param {Object} stats - Statistiche dello stream da OME
   * @returns {Promise<Object>} - Oggetto stream aggiornato
   */
  async updateStreamStats(streamName, stats) {
    try {
      if (!streamName) {
        console.error("updateStreamStats: Stream name is required");
        return null;
      }

      if (!stats || typeof stats !== "object") {
        console.error(
          `updateStreamStats: Invalid stats object for stream ${streamName}`
        );
        return null;
      }

      // Trova lo stream nel database
      const stream = await Stream.findOne({
        username: streamName,
        isActive: true,
      });

      if (!stream) {
        console.warn(
          `Stream ${streamName} non trovato nel database o non attivo`
        );
        return null;
      }

      // Prepara i dati da aggiornare
      const updateData = {
        lastUpdatedAt: new Date(),
      };

      // Aggiungi dati statistici se disponibili
      if (stats.totalConnections !== undefined) {
        updateData.viewers = stats.totalConnections;
      }

      // Gestisce i casi in cui il bitrate è direttamente nell'oggetto stats
      if (stats.videoBitrate !== undefined) {
        updateData.videoBitrate = stats.videoBitrate;
      }
      // Oppure proviene da un oggetto video annidato
      else if (stats.video && stats.video.bitrate) {
        updateData.videoBitrate = stats.video.bitrate;
      }

      // Gestisce vari modi in cui la risoluzione può essere fornita
      if (stats.videoWidth && stats.videoHeight) {
        updateData.videoResolution = `${stats.videoWidth}x${stats.videoHeight}`;
      }

      // Logga le statistiche che stiamo aggiornando
      console.log(`Updating stats for ${streamName}:`, updateData);

      // Aggiorna lo stream nel database
      const updatedStream = await Stream.findOneAndUpdate(
        { username: streamName, isActive: true },
        { $set: updateData },
        { new: true }
      );

      return updatedStream;
    } catch (error) {
      console.error(
        `Errore nell'aggiornamento delle statistiche dello stream ${streamName}:`,
        error
      );
      throw error;
    }
  }
}

export default new StreamService();
