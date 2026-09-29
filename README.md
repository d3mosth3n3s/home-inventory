# To Run

#Terminal 1: \n
#create a virtual environment \n
python -m venv .venv \n
#activate virtual environment \n
.\.venv\Scripts\Activate.ps1 \n
#install requirements \n
pip install -r requirements.txt \n
#at project root, run \n
python -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 5000 \n
#the following should display \n
Uvicorn running on http://127.0.0.1:5000 \n
Application startup complete. \n

#Terminal 2: \n
#path should include (.venv), run \n
cd frontend \n
#install package \n
npm install \n
#then run \n
npm run web \n
#the following should display \n
Starting Metro Bundler \n
Web: http://localhost:8081 \n
#browser should open automatically \n

#previous run instructions
#Open two terminals. In the first, run:`cd backend`, `venv\Scripts\Activate.ps1`, and `python app.py`.
#In the second, run `cd frontend`, and `npx expo start --web`
