import { Router } from 'express';

export const categoriesRouter = Router();

const categories = [
  {
    id: 'transports',
    name: 'Transports',
    description: 'Trucks and logistics providers for construction jobs.',
  },
  {
    id: 'equipment',
    name: 'Equipment',
    description: 'Construction machinery and equipment providers.',
  },
];

categoriesRouter.get('/', (_request, response) => {
  response.json({ categories });
});
