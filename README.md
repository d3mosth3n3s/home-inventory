# To Run

#Terminal 1: #create a virtual environment ( python -m venv .venv ) | #activate virtual environment ( .\.venv\Scripts\Activate.ps1 ) | #install requirements ( pip install -r requirements.txt ) | #at project root, run ( python -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 5000 ) | #the following should display: Uvicorn running on http://127.0.0.1:5000 Application startup complete.

#Terminal 2: #path should include (.venv), run ( cd frontend ) #install package ( npm install ) #then run ( npm run web ) #the following should display: Starting Metro Bundler Web:http://localhost:8081 and browser should open automatically

#previous run instructions
#Open two terminals. In the first, run:`cd backend`, `venv\Scripts\Activate.ps1`, and `python app.py`.
#In the second, run `cd frontend`, and `npx expo start --web`
