//imports electron core modules
const { app, BrowserWindow } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");

//function to create the main application window
function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 1100,
        resizable: true, //allows resizing of window
        fullscreenable: false,
        title: "Crypto Portfolio Tracker",
        webPreferences: {
            contextIsolation: true,
        },
    });

    //removes top bar menu
    win.setMenu(null);

    //load react app from local host in dev
    const startUrl = isDev
        ? "http://localhost:3000"
        : `file://${path.join(__dirname, "frontend/build/index.html")}`;

    win.loadURL(startUrl);
}

//when electron is ready create the window
app.whenReady().then(createWindow);

//quits the app when all windows are closed
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
