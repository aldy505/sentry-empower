import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 5 },   // Ramp up
    { duration: '120s', target: 10 },  // Stay at 10 VUs
    { duration: '20s', target: 1 },   // Ramp down
  ],
};


export default function() {
  // Method 1: Using http.batch() for concurrent requests
  const responses = http.batch([
    { method: 'GET', url: 'http://localhost:8342' },
    { method: 'GET', url: 'http://localhost:8342/products' },
    { method: 'GET', url: 'http://localhost:8342/api/success' },
    { method: "GET", url: "http://localhost:8342/api/products" },
    { method: 'GET', url: 'http://localhost:8342/api/organization' },
    { method: 'POST', url: 'http://localhost:8342/api/enqueue',
      body: JSON.stringify({ email: 'test@example.com' }),
      params: { headers: { 'Content-Type': 'application/json' } }
    },
    { method: "POST", url: "http://localhost:8342/api/checkout?v2=true",
      body: JSON.stringify({"cart":{"items":[{"id":4,"title":"Botana Voice","description":"Lets plants speak for themselves.","descriptionfull":"Now we don't want him to get lonely, so we'll give him a little friend. Let your imagination just wonder around when you're doing these things. Let your imagination be your guide. Nature is so fantastic, enjoy it. Let it make you happy.","price":175,"img":"https://storage.googleapis.com/application-monitoring/plant-to-text.jpg","imgcropped":"https://storage.googleapis.com/application-monitoring/plant-to-text-cropped.jpg","pg_sleep":"","reviews":[{"id":4,"productid":4,"rating":4,"customerid":null,"description":null,"created":"2021-06-04T00:12:33.553Z","pg_sleep":""},{"id":5,"productid":4,"rating":3,"customerid":null,"description":null,"created":"2021-06-04T00:12:45.558Z","pg_sleep":""},{"id":6,"productid":4,"rating":2,"customerid":null,"description":null,"created":"2021-06-04T00:12:50.510Z","pg_sleep":""},{"id":13,"productid":4,"rating":3,"customerid":null,"description":null,"created":"2021-07-01T00:12:43.312Z","pg_sleep":""},{"id":14,"productid":4,"rating":3,"customerid":null,"description":null,"created":"2021-07-01T00:12:54.719Z","pg_sleep":""},{"id":15,"productid":4,"rating":3,"customerid":null,"description":null,"created":"2021-07-01T00:12:57.760Z","pg_sleep":""},{"id":16,"productid":4,"rating":3,"customerid":null,"description":null,"created":"2021-07-01T00:13:00.140Z","pg_sleep":""},{"id":17,"productid":4,"rating":3,"customerid":null,"description":null,"created":"2021-07-01T00:13:00.971Z","pg_sleep":""},{"id":18,"productid":4,"rating":3,"customerid":null,"description":null,"created":"2021-07-01T00:13:01.665Z","pg_sleep":""},{"id":19,"productid":4,"rating":3,"customerid":null,"description":null,"created":"2021-07-01T00:13:02.278Z","pg_sleep":""}]}],"quantities":{"4":1},"total":175},"form":{"email":"plant.lover@example.com","subscribe":"","firstName":"Jane","lastName":"Greenthumb","address":"123 Main Street","city":"San Francisco","country":"United States of America","state":"CA","zipCode":"94122"},"validate_inventory":"true"}),
      params: { headers: { 'content-type': 'application/json', 'email': 'anm@example.com' } },
    }
  ]);

  // Check all responses
  responses.forEach((response, index) => {
    check(response, {
      [`Request ${index + 1} status is 200`]: (r) => r.status === 200,
      [`Request ${index + 1} response time < 500ms`]: (r) => r.timings.duration < 500,
    });
  });

  sleep(1);
}