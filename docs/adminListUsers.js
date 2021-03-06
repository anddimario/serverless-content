/**
 * @api {get} /users Admin list users
 * @apiName AdminListUsers
 * @apiGroup User
 *
 * @apiHeader {String} x-slsmu-site Site identification.
 * @apiHeader {String} Authorization Users token.
 *
 * @apiParam {String} type Api type (list).
 *
 * @apiExample {curl} Example call
 *     curl -H "Authorization: Bearer MY_TOKEN" -H "x-slsmu-site: localhost" "http://localhost:3000/users?type=list"

 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "body": []
 *     }
 */
