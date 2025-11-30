import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/CategoriesController';

const router = Router();

router.post('/categories', createCategory);
router.get('/categories', getCategories);
router.put('/categories/:_id', updateCategory);
router.delete('/categories/:_id', deleteCategory);

export default router;
