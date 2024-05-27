package tv.phantombot.event.ytplayer;

public class YTPlayerDeletePlaylistEvent  extends YTPlayerEvent {
    private final String playlistName;

    /**
     * Class constructor.
     *
     * @param {String} playlistName
     */
    public YTPlayerDeletePlaylistEvent(String playlistName) {
        this.playlistName = playlistName;
    }

    /**
     * Method that returns the playlistName
     *
     * @return {String} playlistName
     */
    public String getPlaylistName() {
        return this.playlistName;
    }
}
