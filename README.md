# EigenLayer Restaking Data API

This project provides a backend API for fetching, storing, and serving data related to restakers and validators on the EigenLayer protocol. It aggregates on-chain and off-chain data, syncs it to a MongoDB database, and exposes RESTful endpoints for easy access.

## Features

- **Data Aggregation**: Fetches restaker, validator, and reward data from the EigenLayer API and Ethereum blockchain.
- **Database Sync**: Stores and updates restaker, validator, and reward information in MongoDB.
- **REST API**: Provides paginated endpoints to query restakers and validators.
- **Modular Structure**: Organized codebase with clear separation of concerns (controllers, models, routes, scripts, config).
- **Environment Configurable**: Uses `.env` for sensitive configuration like database URI and API keys.

## Project Structure

## How It Works

1. **Data Fetching**:  
   The script in [`scripts/fetchData.js`](scripts/fetchData.js) fetches data from the EigenLayer API and Ethereum logs, then updates MongoDB collections for restakers, validators, and rewards.

2. **Database Connection**:  
   MongoDB connection is managed in [`config/index.js`](config/index.js).

3. **API Endpoints**:  
   - `/api/restakers`: Get paginated list of restakers.
   - `/api/validators`: Get paginated list of validators.

4. **Models**:  
   - [`models/restaker.js`](models/restaker.js): Restaker schema.
   - [`models/validator.js`](models/validator.js): Validator schema.
   - [`models/reward.js`](models/reward.js): Reward schema.

5. **Controllers**:  
   - [`controllers/restakeController.js`](controllers/restakeController.js): Handles restaker API logic.
   - [`controllers/validatorController.js`](controllers/validatorController.js): Handles validator API logic.

6. **Routes**:  
   - [`routes/restakers.js`](routes/restakers.js): Restaker endpoints.
   - [`routes/validators.js`](routes/validators.js): Validator endpoints.
   - [`routes/index.js`](routes/index.js): Main router.

7. **Server**:  
   The entry point [`server.js`](server.js) initializes the Express server, connects to MongoDB, and mounts API routes.

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB instance (local or Atlas)

### Installation

1. Clone the repository.
2. Install dependencies:
   ```sh
   npm install
