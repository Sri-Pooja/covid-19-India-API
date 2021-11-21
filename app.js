const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbpath = path.join(__dirname, "covid19India.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDbAndServer();

const convertStateObjectToDbResponseObj = (stateObj) => {
  return {
    stateId: stateObj.state_id,
    stateName: stateObj.state_name,
    population: stateObj.population,
  };
};

const convertDistrictObjTODbObject = (districtObject) => {
  return {
    districtId: districtObject.district_id,
    districtName: districtObject.district_name,
    stateId: districtObject.state_id,
    cases: districtObject.cases,
    cured: districtObject.cured,
    active: districtObject.active,
    deaths: districtObject.deaths,
  };
};

/*

const statsObject = (statsObject) => {
    return 
        {
      totalCases: statsArray.totalCases,
      totalCured: statsArray.totalCured,
      totalActive: statsArray.totalActive,
      totalDeaths: statsArray.totalDeaths,
    }    
};

*/

//return states list in state table.

app.get("/states/", async (request, response) => {
  const statesListQuery = `
        SELECT 
            * 
        FROM 
            state;
    `;
  const statesArray = await db.all(statesListQuery);
  response.send(
    statesArray.map((eachObject) =>
      convertStateObjectToDbResponseObj(eachObject)
    )
  );
});

// get state based in the state id

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  console.log(stateId);
  const getStateQuery = `
        SELECT 
            * 
        FROM 
            state 
        WHERE 
            state_id = ${stateId};
    `;
  const stateArray = await db.get(getStateQuery);
  response.send(convertStateObjectToDbResponseObj(stateArray));
});

//create district in district table

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrict = `
        INSERT INTO 
            district (district_name, state_id, cases, cured, active, deaths)
        VALUES 
            ('${districtName}', ${stateId},${cases}, ${cured}, ${active}, ${deaths});
    `;
  await db.run(createDistrict);
  response.send("District Successfully Added");
});

//return district based on district Id

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT * 
        FROM 
            district
        WHERE 
            district_id = ${districtId}
    `;
  const districtsArray = await db.get(getDistrictQuery);
  response.send(convertDistrictObjTODbObject(districtsArray));
});

//update districts of the district based on the district id

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
        UPDATE 
            district 
        SET         
            district_name= '${districtName}',
            state_id= ${stateId},
            cases= ${cases},
            cured= ${cured},
            active= ${active},
            deaths = ${deaths}
    WHERE 
        district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// delete district

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
        DELETE FROM 
            district 
        WHERE 
            district_id = ${districtId}
    `;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//stats of total deaths, cured

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsQuery = `
        SELECT SUM(cases) AS totalCases, SUM(cured) AS totalCured, SUM(active) AS totalActive, 
            SUM(deaths) AS totalDeaths
        FROM district 
        WHERE state_id = ${stateId};
    `;
  const statsArray = await db.get(statsQuery);
  response.send(
    // statsArray.map((eachObject) => statsObject(eachObject))
    /* {
      totalCases: statsArray.totalCases,
      totalCured: statsArray.totalCured,
      totalActive: statsArray.totalActive,
      totalDeaths: statsArray.totalDeaths,
    }*/
    statsArray
  );
});

//return an object containing the state name of a district

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateOfDistrict = `
        SELECT 
            state_name
        FROM 
            state NATURAL JOIN district 
        WHERE 
            district_id = ${districtId}
    `;
  const districtName = await db.get(getStateOfDistrict);
  response.send({ stateName: districtName.state_name });
});

module.exports = app;
