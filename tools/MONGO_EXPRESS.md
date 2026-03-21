# Mongo-Express Setup

To run a web-based admin interface for your MongoDB:

1. **Start MongoDB** (if not already running)
2. **Run Mongo-Express** via Docker:
   ```bash
   # From tools/mongo-express/
   ./start.sh
   ```

3. **Log in with these credentials**:
   - **Username**: `admin`
   - **Password**: `password`

4. **Access the UI**:
   Open [http://localhost:8081](http://localhost:8081) in your browser.

> [!TIP]
> This command uses `--network="host"` so it can reach your local MongoDB instance. If you want a more permanent setup, I can create a `docker-compose.yml` file for you.
