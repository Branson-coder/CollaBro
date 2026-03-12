# CollaBro

A real-time collaborative full-stack web app for managing tasks across teams. Create taskcards, assign tasks, drag and drop cards across a Kanban style board, and organise a smooth and collaborative team workflow. 

---

## What you'll need

Before getting started, you need to install two things:

- **Git** — to download the project. Download it at https://git-scm.com/downloads, click your operating system, and follow the installer.
- **Docker Desktop** — to run the app. Download it at https://www.docker.com/products/docker-desktop, click your operating system, and follow the installer. Once installed, open Docker Desktop and leave it running in the background.

That's all. You do not need to install Node.js, PostgreSQL, or anything else.

---

## Running the app

### 1. Open a terminal

- **Mac:** Press `Cmd + Space`, type `Terminal`, and hit Enter.
- **Windows:** Press the Windows key, type `PowerShell`, and hit Enter.

### 2. Download the project

Paste this command into the terminal and press Enter:

```bash
git clone https://github.com/your-username/CollaBro.git
```

Then move into the project folder:

```bash
cd CollaBro
```

### 3. Create a configuration file

The backend needs a small config file to run. Paste this command and press Enter:

**Mac/Linux:**
```bash
echo 'DATABASE_URL=postgresql://postgres:postgres@db:5432/collabro
JWT_SECRET=local_dev_secret
PORT=4000' > backend/.env
```

**Windows (PowerShell):**
```powershell
"DATABASE_URL=postgresql://postgres:postgres@db:5432/collabro`nJWT_SECRET=local_dev_secret`nPORT=4000" | Out-File -FilePath backend\.env -Encoding utf8
```

### 4. Start the app

```bash
docker compose up --build
```

The first time you run this it will take a few minutes while Docker downloads everything it needs. You'll know it's ready when you see a message like `Server running on port 4000` in the terminal.

### 5. Open it in your browser

Go to: **http://localhost:5173**

Register an account and you're in. To see the real-time collaboration, open a second browser window or tab to the same address and register a second account.

---

## Stopping the app

Press `Ctrl + C` in the terminal to stop it.

To fully clean up and free up disk space:

```bash
docker compose down
```

---

## Restarting later

Any time you want to run it again, open Docker Desktop, navigate back to the project folder in your terminal, and run:

```bash
docker compose up
```

(No need for `--build` after the first time.)
