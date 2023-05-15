import logging
import requests
import time
from datetime import datetime
from functools import wraps
import json


"""Logs into the Fusion Solar API. Raises an exception if the login fails.
"""
# check the login credentials right away
session = requests.session()
huawei_subdomain = "region01eu5"
url = f"https://{huawei_subdomain[8:]}.fusionsolar.huawei.com/unisso/v2/validateUser.action"
params = {
    "decision": 1,
    "service": f"https://{huawei_subdomain}.fusionsolar.huawei.com/unisess/v1/auth?service=/netecowebext/home/index.html#/LOGIN",
}
json_data = {
    "organizationName": "",
    "username": "xxxxxx",
    "password": "xxxxx",
}
# print(params);
# print(json_data);
# print(url);
# send the request
r = session.post(url=url, params=params, json=json_data)
r.raise_for_status()
# print(r.json())


# make sure that the login worked
# if r.json()["errorCode"]:
#     # _LOGGER.error(f"Login failed: {r.json()['errorMsg']}")
#     raise AuthenticationException(
#         f"Failed to login into FusionSolarAPI: { r.json()['errorMsg'] }"
#     )
print(huawei_subdomain)

# get the main id
r = session.get(
    url=f"https://{huawei_subdomain}.fusionsolar.huawei.com/rest/neteco/web/organization/v2/company/current",
    params={"_": round(time.time() * 1000)},
)
r.raise_for_status()

# catch an incorrect subdomain
response_text = r.content.decode()
print(response_text)
exit(0)

response_data = r.json()



company_id = r.json()["data"]["moDn"]

# get the roarand, which is needed for non-GET requests, thus to change device settings
r = session.get(
    url=f"https://{huawei_subdomain}.fusionsolar.huawei.com/unisess/v1/auth/session"
)
r.raise_for_status()
session.headers["roarand"] = r.json()[
    "csrfToken"
]  # needed for post requests, otherwise it will return 401
