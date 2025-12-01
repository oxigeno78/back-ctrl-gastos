import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/CategoriesController';
import { authenticateToken } from '../controllers/authController';

const router = Router();

router.use(authenticateToken);

router.post('/', createCategory);
router.get('/', getCategories);
router.put('/:_id', updateCategory);
router.delete('/:_id', deleteCategory);

export default router;
