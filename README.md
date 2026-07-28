# OkiaOverlay

a Browser Source based overlay for spotify.

> [!NOTE]
Spotify Premium is required solely for setting up the developer app as free accounts cannot use the API. If you know someone who is a premium user has gone through this setup already, you can ask them to add your email to their app in 'User Management' and get the Client ID of their app (Client ID is safe to expose, its just an application identifier).

## How Does It Work?

Unfortunately spotify now only accepts third-party applications applying for extended Web API access to be a legally registered business organization with at least 250,000 Monthly Active Users (of which I am not).

therefore you will need spotify premium, and to set up a small developer app yourself to act as the intermediary for the overlay.

> The overlay makes a fetch every 10s for the currently playing song to your developer app using your account. anyone can do this as developer apps are public, but only whitelisted users requests actually get handled.

[0kia.github.io/OkiaOverlay/](https://0kia.github.io/OkiaOverlay/)
