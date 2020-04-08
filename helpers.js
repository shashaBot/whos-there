const HTTP_STATUS_CODES = {
  BAD_REQUEST: {
    status: 'Bad Request',
    code: 400
  },
  UNAUTHORIZED: {
    status: 'Unauthorized',
    code: 401
  },
  SUCCESS: {
    status: 'Success',
    code: 200
  }
}

function JSONResponse(res, status_code, success, data) {
  let { status, code } = HTTP_STATUS_CODES[status_code];
  return res.status(HTTP_STATUS_CODES[status_code].code).json({
    success,
    status,
    code,
    data
  });
};

module.exports = {
  HTTP_STATUS_CODES,
  JSONResponse
}
