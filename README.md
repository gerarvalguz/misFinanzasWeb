<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1c43HeUSI04M_Oyuup22Uk6N_jRcLfmlJ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages

This project is configured to be deployed to GitHub Pages.

1.  Make sure you have installed all the dependencies:
    `npm install`
2.  Run the deploy script:
    `npm run deploy`

This will build the application and deploy it to the `gh-pages` branch of your repository. The site will be available at the URL specified in your `package.json` "homepage" field.
