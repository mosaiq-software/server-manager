import { getUser } from '@/controllers/userController';
import { API_BODY, API_PARAMS, API_RETURN, API_ROUTES } from 'common';
import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        res.status(200).send('Hello from the API');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

router.get(API_ROUTES.GET_USER, async (req, res) => {
    const params = req.params as API_PARAMS[API_ROUTES.GET_USER];
    try {
        if (!params.userId) {
            res.status(400).send('No userId provided');
            return;
        }
        const userData = await getUser(params.userId);
        if (!userData) {
            res.status(404).send('User not found');
            return;
        }
        const response: API_RETURN[API_ROUTES.GET_USER] = userData;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error getting user', e);
        res.status(500).send('Internal server error');
    }
});

router.post(API_ROUTES.POST_SAVE_USER, async (req, res) => {
    const body: API_BODY[API_ROUTES.POST_SAVE_USER] = req.body;
    const params = req.params as API_PARAMS[API_ROUTES.GET_USER];
    const bearerToken = req.headers.authorization?.split(' ')[1]; // if you're doing auth!
    try {
        const user = await getUser(params.userId);
        // save user in controller...
        const response: API_RETURN[API_ROUTES.POST_SAVE_USER] = user;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error saving user', e);
        res.status(500).send('Internal server error');
    }
});

export default router;
