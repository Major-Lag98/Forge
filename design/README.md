## 01 — Login
[01-login.png]
Description: Vertical split to separate sign-in and Title. The left side of the split takes 1/3 of the window, and the right side takes 2/3 of the window. The left side is where the user interacts with the app to sign in featuring a Sign in text banner, a text entry box prompting a username below the banner, and below the banner is a rounded button with an arrow to indicate submission. On the right side is a big title showing the name of the app and my name.
Purpose: User login. Username only, no password. Single button sign-on. Display name of app and me.
Components: Banners, Text input box, Submission button.
State / flow: Clicking the arrow button will change the page to the welcome page.
Open questions / things I'm unsure of: I'm unsure if after a while of sitting idle on the sign-in screen with no submission if there should be a tooltip that pops up to say what to do. I'm unsure of what the color pallet should be, maybe something metal like dark-grey and black and red? A color pallet that makes sense.

## 02 — Welcome
[02-welcome.png]
Description: Vertical split to separate the catalog of games from game information. The left side of the split takes up 1/8 of the window, and the right side takes 7/8 of the screen. The left side shows a big F on the top to indicate the game logo. Below the logo is the catalog of games. The games are displayed in single file descending. The right side welcomes the user and describes to them to select a game from the catalog. 
Purpose: Introduce the user to the catalog. Simple buttons that select games for viewing.
Components: Buttons to select game, banners to display F logo, and banners to display the welcome text.
State / flow: This view is reached from the login view. This is a final state of the screen, meaning when the user selects a game the screen de-populates the right side to then repopulate with game details.
Open questions / things I'm unsure of: I am unsure if the vertical split should be animated coming from the login screen. For example after the user logs in should the vertical split slide into position in the welcome screen? Should there be a home button over the catalog of games that takes the user back to the welcome state from a selected game?

## 03 — Install Game
[03-install-game.png]
Description: Same window as the Welcome view. A game is selected and on the left side the catalog indicates which game the user selected. The right side of the view now shows the details of the game while prompting the user to install. The user does not need to install the selected game and can still choose another game.
Purpose: Indicate that a game is selected and not installed. Provide a button to install a game.
Components: Catalog buttons, Install button, Game Title Banner, Game details banner.
State / flow: This view is reached by selecting a game from the catalog. When the install button is pressed the install button will disable and the selected game will install.
Open questions / things I'm unsure of: What type of indication of the install progress. Should it be a number percentage? Should it be a progress bar? Both? Something fancy like the button becomes the progress bar with the percentage as its inside text?

## 04 — Select Game 1
[04-select-game-1.png]
Description: Same window as the welcome and install view. The game is now properly installed and ready to play. The install button went from an install button to a play button. The game title banner and game description remain in place from the install view.
Purpose: To indicate that a game is ready to play.
Components: Catalog buttons, Play button, Game Title Banner, Game details banner.
State / flow: This page is reached by having an installed game selected.
Open questions / things I'm unsure of: I'm unsure of the background of the game details side of the view. Should it be plain? Is it easy to have screenshots display behind everything in the details section of the view?

## 05 — Select Game 2
[05-select-game-2.png]
Description: Same as the welcome view and any selected game view. This image is to show how the catalog changes to indicate the selected game. If the game isn't installed, the play button would be an install button.
Purpose: To indicate that game 2 is ready to play.
Components: Catalog buttons, Play button, Game Title Banner, Game details banner.
State / flow: This page is reached by having an installed game selected.
Open questions / things I'm unsure of: I'm unsure of how to indicate to the user what specific game is selected. I feel like text with a darker background is kind of bland. Maybe the catalog buttons are not text but instead the game icon images. maybe when a catalog game is selected with its icon image have it pop out a smidge as the effect that its selected? Maybe a simple highlight of the border of the icon in the catalog? There are so many options and I'm not sure how to weigh the effort here.

## 06 — Select Game 3
[06-select-game-3.png]
Description: Same as the welcome view and any selected game view. This image reinforces the same pattern of catalog selection as 05 - select game 2 image.
Purpose: Game selection pattern reinforcement.
Components: Catalog buttons, Play button, Game Title Banner, Game details banner.
State / flow: This page is reached by having an installed game selected.
Open questions / things I'm unsure of: 
