import { Router } from "express";
import { z } from "zod";
import { notificationService } from "./notification-service";
import { updateNotificationSchema } from "@shared/notification-schema";

const router = Router();

// Get user notifications
router.get("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const unreadOnly = req.query.unreadOnly === 'true';
    const excludeArchived = req.query.excludeArchived !== 'false';

    const notifications = await notificationService.getUserNotifications(userId, {
      limit,
      offset,
      unreadOnly,
      excludeArchived
    });

    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Failed to get notifications" });
  }
});

// Get unread notification count
router.get("/unread-count", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const count = await notificationService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Failed to get unread count" });
  }
});

// Mark notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await notificationService.markAsRead(notificationId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.patch("/mark-all-read", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
});

// Archive notification
router.patch("/:id/archive", async (req, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await notificationService.archiveNotification(notificationId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Archive notification error:", error);
    res.status(500).json({ message: "Failed to archive notification" });
  }
});

// Get user notification preferences
router.get("/preferences", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const preferences = await notificationService.getUserPreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error("Get notification preferences error:", error);
    res.status(500).json({ message: "Failed to get notification preferences" });
  }
});

// Update user notification preferences
router.patch("/preferences", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const preferences = await notificationService.updateUserPreferences(userId, req.body);
    res.json(preferences);
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({ message: "Failed to update notification preferences" });
  }
});

export default router;