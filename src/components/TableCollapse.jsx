import React, { useState } from "react";
import {
  Collapse,
  Button,
  Card,
  Typography,
  Input,
  Select,
  Option,
} from "@material-tailwind/react";
import axios from "axios";

// Replace with your YouTube API key
const API_KEY = import.meta.env.VITE_YT_API;

const TableCollapse = () => {
  const [open, setOpen] = useState({});
  const [channels, setChannels] = useState([]);
  const [channelName, setChannelName] = useState("");
  const [sortOption, setSortOption] = useState("date");
  const [dateRange, setDateRange] = useState(7); // Default to last 7 days
  const [videoData, setVideoData] = useState({}); // Store video data per channel

  // Function to handle adding a new channel
  const addChannel = () => {
    if (channelName.trim() !== "" && !channels.includes(channelName)) {
      setChannels([...channels, channelName]);
      setChannelName("");
      setVideoData((prev) => ({ ...prev, [channelName]: [] })); // Initialize video data for the new channel
    }
  };

  // Function to fetch video data for a channel using YouTube Data API
  const fetchVideoData = async (channel) => {
    try {
      // Step 1: Fetch the channel ID using the channel name
      const channelResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${channel}&type=channel&key=${API_KEY}`
      );
      const channelId = channelResponse.data.items[0]?.id?.channelId;

      if (!channelId) {
        alert("Channel not found.");
        return;
      }

      // Step 2: Fetch videos for the channel
      const videoResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=${sortOption}&key=${API_KEY}`
      );

      const videoIds = videoResponse.data.items
        .map((item) => item.id.videoId)
        .join(",");

      // Step 3: Fetch video statistics for each video
      const statsResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${API_KEY}`
      );

      const videoData = statsResponse.data.items.map((video) => ({
        name: video.snippet.title,
        views: video.statistics.viewCount,
        date: video.snippet.publishedAt.split("T")[0], // Get just the date part
      }));

      setVideoData((prev) => ({ ...prev, [channel]: videoData }));
    } catch (error) {
      console.error("Error fetching video data:", error);
      alert("Failed to retrieve video data.");
    }
  };

  // Toggle collapse and refresh data when opened
  const toggleOpen = (channel) => {
    setOpen((cur) => ({ ...cur, [channel]: !cur[channel] }));
    if (!open[channel]) fetchVideoData(channel); // Fetch data when the section is expanded
  };

  // Adjust date range
  const adjustDateRange = (amount) => {
    setDateRange((prev) => Math.max(1, prev + amount)); // Minimum 1 day
  };

  // Sort video data based on sortOption
  const sortedVideos = (channel) => {
    const videos = videoData[channel] || [];
    if (sortOption === "views") {
      return videos.sort((a, b) => b.views - a.views);
    }
    return videos.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <div className="p-5">
      <div className="mb-5">
        <Input
          type="text"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="Add Channel Name"
        />
        <Button className="mt-2" onClick={addChannel}>
          Add Channel
        </Button>
      </div>

      {channels.map((channel) => (
        <div key={channel} className="mb-4">
          <Button className="w-full" onClick={() => toggleOpen(channel)}>
            {open[channel] ? "Collapse" : `Expand ${channel}`}
          </Button>
          <Collapse open={open[channel]}>
            <Card className="h-full w-full p-4">
              <div className="flex justify-between mb-4">
                <div>
                  <Typography variant="small" color="blue-gray">
                    Sort by:
                  </Typography>
                  <Select
                    value={sortOption}
                    onChange={(e) => setSortOption(e)}
                    className="ml-2"
                  >
                    <Option value="date">Date</Option>
                    <Option value="views">Most Views</Option>
                  </Select>
                </div>
                <div>
                  <Button onClick={() => adjustDateRange(-1)}>-</Button>
                  <Typography variant="small" className="inline mx-2">
                    {dateRange} days
                  </Typography>
                  <Button onClick={() => adjustDateRange(1)}>+</Button>
                </div>
              </div>

              <table className="w-full min-w-max table-auto text-left">
                <thead>
                  <tr>
                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal leading-none opacity-70"
                      >
                        Video Name
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal leading-none opacity-70"
                      >
                        Views
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal leading-none opacity-70"
                      >
                        Date
                      </Typography>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVideos(channel).map(({ name, views, date }, index) => (
                    <tr key={index}>
                      <td className="p-4 border-b border-blue-gray-50">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal"
                        >
                          {name}
                        </Typography>
                      </td>
                      <td className="p-4 border-b border-blue-gray-50">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal"
                        >
                          {views}
                        </Typography>
                      </td>
                      <td className="p-4 border-b border-blue-gray-50">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal"
                        >
                          {date}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Collapse>
        </div>
      ))}
    </div>
  );
};

export default TableCollapse;
