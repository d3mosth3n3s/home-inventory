# To Run

#Terminal 1 GCloud set up: download Google Cloud CLI at https://docs.cloud.google.com/sdk/docs/install-sdk | run for first time set up ` gcloud auth login ` | then run ` gcloud config set project recovered-510021 ` | then run ` gcloud auth application-default login ` | then run ` gcloud auth application-default set-quota-project recovered-510021 `

#Terminal 2 Back end: create a virtual environment ` python -m venv .venv ` | activate virtual environment ` .\.venv\Scripts\Activate.ps1 ` | install requirements ` pip install -r requirements.txt ` | at project root, run ` python -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 5000 ` | the following should display: Uvicorn running on http://127.0.0.1:5000 Application startup complete.

#Terminal 3 Front end: path should include (.venv) | run ` cd frontend ` | install package ` npm install ` | then run ` npm run web ` | the following should display: Starting Metro Bundler Web:http://localhost:8081 and browser should open automatically
