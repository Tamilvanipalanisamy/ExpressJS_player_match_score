const express = require("express");
const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`Server error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API1

//Convert to object

const convertPlayerDbObject = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getAllPlayerQuery = `
    SELECT * from player_details`;

  const getAllPlayerResponse = await db.all(getAllPlayerQuery);
  response.send(
    getAllPlayerResponse.map((eachPlayer) => convertPlayerDbObject(eachPlayer))
  );
});

// API2
//GET Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerByIDQuery = `
    SELECT * 
        FROM player_details
    WHERE player_id=${playerId};`;
  const getPlayerByIDResponse = await db.get(getPlayerByIDQuery);
  response.send(getPlayerByIDResponse);
});

//API3
//Updates the details of a specific player based on the player ID

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerByIdQuery = `
    UPDATE player_details
    SET player_name=${playerName}
    WHERE player_id=${playerId}`;
  const updatePlayerByIdResponse = await db.run(updatePlayerByIdQuery);
  response.send("Player Details Updated");
});

//API4
//Returns the match details of a specific match

const convertMatchObj = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchByIdQuery = `
    SELECT * from match_details
    WHERE match_id=${matchId}`;
  const getMatchByIdResponse = await db.get(getMatchByIdQuery);
  response.send(convertMatchObj(getMatchByIdResponse));
});

//API5
//Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPlayerDbQuery = `
    SELECT * from player_match_score
    WHERE player_id=${playerId}`;
  const getMatchesOfPlayerResponse = await db.all(getMatchesOfPlayerDbQuery);
  const matchIdArr = getMatchesOfPlayerResponse.map((eachMatch) => {
    return eachMatch.match_id;
  });

  const getMatchDetailsQuery = `
    SELECT * FROM match_details
    WHERE match_id in (${matchIdArr})`;
  const getMatchDetailsResponse = await db.all(getMatchDetailsQuery);
  response.send(
    getMatchDetailsResponse.map((eachMatch) => convertMatchObj(eachMatch))
  );
});

//API6
//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = `
    SELECT * FROM player_match_score
    WHERE match_id=${matchId}`;
  const getPlayersOfMatchResponse = await db.all(getPlayersOfMatchQuery);
  const playersIdArr = getPlayersOfMatchResponse.map((eachMatch) => {
    return eachMatch.player_id;
  });

  const getPlayerDetailsQuery = `
    SELECT * FROM player_details
    WHERE player_id IN (${playersIdArr})`;
  const getPlayerDetailsResponse = await db.all(getPlayerDetailsQuery);
  response.send(
    getPlayerDetailsResponse.map((eachPlayer) =>
      convertPlayerDbObject(eachPlayer)
    )
  );
});

//API7
//convert player stats to object
const playerStatsObject = (playerName, statsObj) => {
  return {
    playerId: statsObj.player_id,
    playerName: playerName,
    totalScore: statsObj.totalScore,
    totalFours: statsObj.totalFours,
    totalSixes: statsObj.totalSixes,
  };
};

//GET Returns the statistics of the total score, fours, sixes
//  of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
    SELECT player_name
        FROM player_details
    WHERE player_id=${playerId};`;
  const getPlayerNameResponse = await db.get(getPlayerNameQuery);
  const getPlayerStatisticsQuery = `
    SELECT 
        player_id,
        sum(score) AS totalScore,
        sum(fours) AS totalFours,
        sum(sixes) AS totalSixes
    FROM 
        player_match_score
    WHERE 
        player_id=${playerId};`;

  const getPlayerStatisticsResponse = await db.get(getPlayerStatisticsQuery);
  response.send(
    playerStatsObject(
      getPlayerNameResponse.player_name,
      getPlayerStatisticsResponse
    )
  );
});
