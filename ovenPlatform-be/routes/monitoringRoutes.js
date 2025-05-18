import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import omeService from "../services/omeService.js";
import streamService from "../services/streamService.js";

const router = express.Router();

// Protect all routes with authentication middleware
router.use(authenticate);

// Route per forzare un controllo del monitoraggio degli stream
router.post("/check-streams", async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin privileges required",
      });
    }

    console.log("Manual stream monitoring check triggered by admin");

    // Ottieni lo stato prima del check
    const beforeStreams = await streamService.getActiveStreams();

    // Forza l'esecuzione del monitoraggio
    await omeService.monitorStreams();

    // Ottieni gli stream attivi dopo il monitoraggio
    const afterStreams = await streamService.getActiveStreams();

    // Controlla se ci sono stati cambiamenti
    const beforeCount = beforeStreams.length;
    const afterCount = afterStreams.length;
    const hasChanges = beforeCount !== afterCount;

    res.status(200).json({
      success: true,
      message: `Stream monitoring check completed. ${hasChanges ? "Changes detected." : "No changes detected."}`,
      before: {
        count: beforeCount,
        streams: beforeStreams.map((s) => ({
          username: s.username,
          isActive: s.isActive,
        })),
      },
      after: {
        count: afterCount,
        streams: afterStreams.map((s) => ({
          username: s.username,
          isActive: s.isActive,
        })),
      },
    });
  } catch (error) {
    console.error("Error during monitoring check:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during monitoring check: " + error.message,
    });
  }
});

// Route per riavviare il sistema di monitoraggio
router.post("/restart-monitoring", async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin privileges required",
      });
    }

    // Riavvia il monitoraggio
    omeService.stopStreamMonitoring();
    omeService.startStreamMonitoring();

    res.status(200).json({
      success: true,
      message: "Stream monitoring restarted successfully",
    });
  } catch (error) {
    console.error("Error restarting monitoring:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while restarting monitoring",
    });
  }
});

export default router;
