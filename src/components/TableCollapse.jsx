import React, { useState } from "react";
import {
  Collapse,
  Button,
  Card,
  Typography,
  Input,
  Select,
  Option,
  Checkbox,
} from "@material-tailwind/react";
import axios from "axios";

// Replace with your YouTube API key
const API_KEY = import.meta.env.VITE_YT_API1;

// Helper function to format large numbers
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 10000) return (num / 1000).toFixed(1) + "k";
  return num.toLocaleString(); // Add commas for numbers below 10,000
};

// Helper function to calculate the date X days ago
const getDateXDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const TableCollapse = () => {
  const [open, setOpen] = useState({});
  const [channels, setChannels] = useState([]);
  const [channelName, setChannelName] = useState("");
  const [sortOption, setSortOption] = useState("date");
  const [maxResults, setMaxResults] = useState(10); // Default number of results
  const [dateRange, setDateRange] = useState(5); // Default to last 5 days
  const [sortByViews, setSortByViews] = useState(false); // Checkbox for sorting by views
  const [videoData, setVideoData] = useState({}); // Store video data per channel

  // Function to handle adding a new channel
  const addChannel = () => {
    if (channelName.trim() !== "" && !channels.includes(channelName)) {
      setChannels([...channels, channelName]);
      setChannelName("");
      setVideoData((prev) => ({ ...prev, [channelName]: [] })); // Initialize video data for the new channel
    }
  };

  // Fetch videos sorted by "Most Views" (Top videos of all time)
  const fetchTopVideos = async (channel) => {
    try {
      const channelResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${channel}&type=channel&key=${API_KEY}`
      );
      const channelId = channelResponse.data.items[0]?.id?.channelId;

      if (!channelId) {
        alert("Channel not found.");
        return;
      }

      const videoResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=viewCount&key=${API_KEY}`
      );

      const videoIds = videoResponse.data.items
        .map((item) => item.id.videoId)
        .join(",");

      const statsResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${API_KEY}`
      );

      const videoData = statsResponse.data.items.map((video) => ({
        name: video.snippet.title,
        views: video.statistics.viewCount,
        likes: video.statistics.likeCount,
        dislikes: video.statistics.dislikeCount
          ? video.statistics.dislikeCount
          : "Link",
        comments: video.statistics.commentCount,
        date: video.snippet.publishedAt.split("T")[0], // Get just the date part
        link: `https://www.youtube.com/watch?v=${video.id}`,
      }));

      setVideoData((prev) => ({ ...prev, [channel]: videoData }));
    } catch (error) {
      console.error("Error fetching video data:", error);
      alert("Failed to retrieve video data.");
    }
  };

  // Fetch videos sorted by "Date" and filter by last X days
  const fetchDateVideos = async (channel) => {
    try {
      const channelResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${channel}&type=channel&key=${API_KEY}`
      );
      const channelId = channelResponse.data.items[0]?.id?.channelId;

      if (!channelId) {
        alert("Channel not found.");
        return;
      }

      let orderBy = sortByViews ? "viewCount" : "date"; // Optional sorting by views
      const publishedAfter = getDateXDaysAgo(dateRange);

      const videoResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=${orderBy}&publishedAfter=${publishedAfter}&key=${API_KEY}`
      );

      const videoIds = videoResponse.data.items
        .map((item) => item.id.videoId)
        .join(",");

      const statsResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${API_KEY}`
      );

      const videoData = statsResponse.data.items.map((video) => ({
        name: video.snippet.title,
        views: video.statistics.viewCount,
        likes: video.statistics.likeCount,
        dislikes: video.statistics.dislikeCount
          ? video.statistics.dislikeCount
          : "Link",
        comments: video.statistics.commentCount,
        date: video.snippet.publishedAt.split("T")[0], // Get just the date part
        link: `https://www.youtube.com/watch?v=${video.id}`,
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
    if (!open[channel]) {
      if (sortOption === "views") {
        fetchTopVideos(channel); // Fetch top videos by views
      } else {
        fetchDateVideos(channel); // Fetch videos by date and range
      }
    }
  };

  // Adjust date range
  const adjustDateRange = (amount) => {
    setDateRange((prev) => Math.max(1, prev + amount)); // Minimum 1 day
    channels.forEach((channel) => fetchDateVideos(channel)); // Update data on change
  };

  // Adjust maxResults (number of videos)
  const adjustMaxResults = (amount) => {
    setMaxResults((prev) => Math.max(5, prev + amount)); // Minimum 5 videos
    channels.forEach((channel) => {
      if (sortOption === "views") fetchTopVideos(channel);
      else fetchDateVideos(channel);
    }); // Update data on change
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
                <div>
                  <Button onClick={() => adjustMaxResults(-5)}>-</Button>
                  <Typography variant="small" className="inline mx-2">
                    {maxResults} results
                  </Typography>
                  <Button onClick={() => adjustMaxResults(5)}>+</Button>
                </div>
                <Checkbox
                  label="Sort by Views"
                  checked={sortByViews}
                  onChange={() => setSortByViews(!sortByViews)}
                />
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
                        Name
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
                        Likes
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal leading-none opacity-70"
                      >
                        Link/DL
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal leading-none opacity-70"
                      >
                        Comments
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
                  {videoData[channel]?.map(
                    (
                      { name, views, likes, dislikes, comments, date, link },
                      index
                    ) => (
                      <tr key={index}>
                        <td className="p-4 border-b border-blue-gray-50">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal"
                          >
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {name}
                            </a>
                          </Typography>
                        </td>
                        <td className="p-4 border-b border-blue-gray-50">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal"
                          >
                            {formatNumber(views)}
                          </Typography>
                        </td>
                        <td className="p-4 border-b border-blue-gray-50">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal"
                          >
                            {formatNumber(likes)}
                          </Typography>
                        </td>
                        <td className="p-4 border-b border-blue-gray-50">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal"
                          >
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {dislikes}
                            </a>
                          </Typography>
                        </td>
                        <td className="p-4 border-b border-blue-gray-50">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal"
                          >
                            {formatNumber(comments)}
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
                    )
                  )}
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
