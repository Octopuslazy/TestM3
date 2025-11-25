// let baseURL = `https://c5.woay.io/`; //dev
let baseURL = `https://hc5.woay.io/`; //production
// let baseURL = `https://c5.woay.io/`; //uat
var token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF5ZXJfaWQiOjYwOTAsImdhbWVfaWQiOiI0NDkzIiwicm9sZXMiOlsibWF0Y2hfMyJdLCJleHAiOjE2Njk5NTU3NDR9.6HKDwXFrgR9OBPtY3nzO7P9FMuxn1GieHOegE7DoZ2g";
let contentType = "application/json";
let isFakeData = true;

const isLog = true;
const log = content => {
  if (isLog) {
   //console.log("[API] : ", content);
  }
};

const requestBase = (url, headers, body, method = "POST") => {
  const requestInfo = { method, headers };
  if (method === "POST") {
    requestInfo.body = body;
  }
  return fetch(url, requestInfo).then(res => res.json());
};

export function getParamsUrl(apiName, data) {
  let retVal = baseURL + apiName;
  retVal += "?";
  const keys = Object.keys(data);
  for (let key of keys) {
    if (data[key] !== undefined && data[key] !== "")
      retVal += key + "=" + data[key];
    retVal += "&";
  }
  return retVal.substring(0, retVal.length - 1);
}

const request = (
  apiName,
  params,
  response,
  body = {},
  headers = { "Authorization": token, "Content-Type": contentType },
  method = "GET",
  retryCount = 0
) => {
  const url = getParamsUrl(apiName, params);
  return requestBase(url, headers, body, method)
    .then(resAsData => {
      resAsData.isSuccess = resAsData.error === undefined;
      if (resAsData.isSuccess) {
        log(`Res : API:${apiName} | Data:${JSON.stringify(resAsData)}`);
      } else {
        log(`Res : ERROR Code: ${resAsData.error.code} Mes: ${resAsData.error.message}`);
      }
      response(resAsData);
    })
    .catch(error => {
      log(`Mes: ${error}`);
      if (retryCount >= 3) {
        response({ isSuccess: false, error:{code: 404, message: error}});
      } else {
        request(
          apiName,
          params,
          response,
          body,
          headers,
          method,
          retryCount + 1
        );
      }
      // response({ isSuccess: false, message: error });
    });
};

export function setToken(urlToken: string) {
  token = "Bearer " + urlToken;
}

export function requestPlayGame(level: number, callback) {
  if (isFakeData) {
    return setTimeout(() => {
      callback({
        isSuccess: true,
        code: 1,
        message: null,
        data: {
          "turn_id": 259953
        }
      });
    }, 1000);
  }

  return request(
    "api.match-3-game/play",
    {},
    callback,
    JSON.stringify({level: level}),
    { "Authorization": token, "Content-Type": contentType },
    "POST"
  )
}

export function requestCompleteGame(data, callback) {
  if (isFakeData) {
    return setTimeout(() => {
      callback({
        isSuccess: true,
        code: 1,
        message: null,
        data: {
          "player_id": 6064,
          "game_id": 4493,
          "turn_id": 259954,
          "level": 1,
          "is_completed": false,
          "is_test_mode": false,
          "star": 2,
          "moves": [
              {}
          ],
          "created_at": "2022-11-06T04:30:24.254Z",
          "updated_at": "2022-11-06T04:30:24.254Z",
          "id": 16
      }
      });
    }, 1000);
  }

  return request(
    "api.match-3-game/complete",
    {},
    callback,
    JSON.stringify(data),
    { "Authorization": token, "Content-Type": contentType },
    "POST"
  )
}

export function requestRank(callback) {
  if (isFakeData) {
    return setTimeout(() => {
      callback({
        isSuccess: true,
        code: 1,
        message: null,
        data: [
          {
              "player_id": 4084,
              "sum": "20",
              "last_time": "2022-11-25T10:18:19.382Z",
              "player_name": "test"
          },
          {
              "player_id": 4085,
              "sum": "10",
              "last_time": "2022-11-25T10:18:20.382Z",
              "player_name": "test-123"
          }
      ]
      });
    }, 1000);
  }

  return request(
    "api.match-3-game/leaderboard",
    {},
    callback,
    JSON.stringify({limit: 20}),
    { "Authorization": token, "Content-Type": contentType },
    "GET"
  )
}

export function requestClaimReward(levelNum: number, callback) {
  if (isFakeData) {
    return setTimeout(() => {
      callback({
        isSuccess: true,
        code: 1,
        message: null,
        data: {
          rewards: [
              "Voucher 100.000",
              "5 lượt",
              "Voucher 500k",
              "Voucher 20%"
          ]
      }
      });
    }, 1000);
  }

  return request(
    "api.match-3-game/claim-by-level",
    {},
    callback,
    JSON.stringify({level: levelNum}),
    { "Authorization": token, "Content-Type": contentType },
    "POST"
  )
}

export function requestClaimStarsReward(star: number, callback) {
  if (isFakeData) {
    return setTimeout(() => {
      callback({
        isSuccess: true,
        code: 1,
        message: null,
        data: {
          "rewards": [
            "Voucher California",
						"5 lượt vòng quay may mắn",
						"1 vé vàng"
        ]
      }
      });
    }, 1000);
  }

  return request(
    "api.match-3-game/claim-by-star",
    {},
    callback,
    JSON.stringify({star: star}),
    { "Authorization": token, "Content-Type": contentType },
    "POST"
  )
}


export function requestClaimStreakReward(streak: number, callback) {
  if (isFakeData) {
    return setTimeout(() => {
      callback({
        isSuccess: true,
        code: 1,
        message: null,
        data: {
          "rewards": [
            "1 Vé vàng",
						"5 lượt vòng quay may mắn",
        ]
      }
      });
    }, 1000);
  }

  return request(
    "api.match-3-game/claim-by-win-streak",
    {},
    callback,
    JSON.stringify({win_streak: streak}),
    { "Authorization": token, "Content-Type": contentType },
    "POST"
  )
}

export function requestGetData(callback) {
  if (isFakeData) {
    return setTimeout(() => {
      callback({
        isSuccess: true,
        code: 1,
        message: null,
        data: {
          "level": 3,
          "history": [
              {
                  "level": 1,
                  "star": 3
              },
              {
                  "level": 2,
                  "star": 3
              },
              {
                  "level": 3,
                  "star": 3
              },
              {
                  "level": 4,
                  "star": 3
              },
              {
                  "level": 5,
                  "star": 3
              },
              {
                  "level": 6,
                  "star": 3
              },
              {
                  "level": 7,
                  "star": 3
              },
              {
                  "level": 8,
                  "star": 3
              },
              {
                  "level": 9,
                  "star": 3
              },
              {
                  "level": 10,
                  "star": 3
              },
              {
                  "level": 11,
                  "star": 3
              },
              {
                  "level": 12,
                  "star": 3
              },
              {
                  "level": 13,
                  "star": 3
              },
              {
                  "level": 14,
                  "star": 3
              }
          ],
          "player_name": "",
          "player_phone": "+84914223399",
          "total_turn": 101,
          "used_turn": 6,
          "unused_turn": 95,
          "today_turn_earn": 5,
          "today_turn_max": 10,
          "remain_time_next_turn": 1700,
          "total_star": 120,
          "win_streak": 11,
          "star_rewards": { 
              10: true,
              20: false,
              30: false,
              40: false,
              50: false,
              60: false,
          },
          "win_streak_rewards": { 
              3: true,
              6: true,
              9: false
          }
        }
      });
    }, 1000);
  }

  return request(
    "api.match-3-game/info",
    {},
    callback,
    {},
    { "Authorization": token, "Content-Type": contentType },
    "GET"
  )
}

