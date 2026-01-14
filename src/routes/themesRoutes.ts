import { Router } from "express";
import { authenticateToken } from "../controllers/authController";
import { createUserTheme, getUserThemes, getThemeById, updateUserTheme } from "../controllers/ThemesController";

const router = Router();

router.get('/', authenticateToken, getUserThemes);
router.get('/theme/:_id', authenticateToken, getThemeById);
router.post('/theme', authenticateToken, createUserTheme);
router.put('/theme/:_id', authenticateToken, updateUserTheme);

export default router;