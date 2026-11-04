import app from './app';
import { Config } from './config';
import logger from './config/logger';

const startServer = () => {
    const PORT = Config.PORT;
    try {
        app.listen(PORT, (error) => {
            // Express 5 passes bind errors (e.g. EADDRINUSE) to this callback
            if (error) {
                logger.error(
                    `Failed to start on port ${PORT}: ${error.message}`,
                );
                process.exit(1);
            }
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

startServer();
