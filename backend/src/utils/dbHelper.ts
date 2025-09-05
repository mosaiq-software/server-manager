import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: `${process.env.DATABASE_DIR}/${process.env.DATABASE_NAME}`,
    logging: process.env.DATABASE_LOGGING === 'true',
});
