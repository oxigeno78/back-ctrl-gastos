import { Router } from 'express';
import { authenticateToken } from '../controllers/authController';
import { getUnReadNotificationByUserId, setNotificationAsReaded, setAllNotificationsAsReaded, deleteNotification } from '../controllers/notificationsController';

const router = Router();

router.use(authenticateToken);

router.post('/:userId', getUnReadNotificationByUserId);
router.put('/:userId/:_id', setNotificationAsReaded);
router.put('/:userId', setAllNotificationsAsReaded);
router.delete('/:userId/:_id', deleteNotification);

export default router;