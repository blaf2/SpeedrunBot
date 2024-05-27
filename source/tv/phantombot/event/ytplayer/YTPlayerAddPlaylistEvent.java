package tv.phantombot.event.ytplayer;

public class YTPlayerAddPlaylistEvent extends YTPlayerEvent {
    private final String youTubeID;

    public YTPlayerAddPlaylistEvent() {
        this.youTubeID = "";
    }

    public YTPlayerAddPlaylistEvent(String youTubeID) {
        this.youTubeID = youTubeID;
    }

    public String getYouTubeID() {
        return this.youTubeID;
    }
}
