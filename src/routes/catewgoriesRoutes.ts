import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/CategoriesController';
import { authenticateToken } from '../controllers/authController';

const router = Router();

router.use(authenticateToken);

router.post('/categories', createCategory);
router.get('/categories', getCategories);
router.put('/categories/:_id', updateCategory);
router.delete('/categories/:_id', deleteCategory);

export default router;
