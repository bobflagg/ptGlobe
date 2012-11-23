'''
Utility module for dumping project data to a json file suitable for use
in geo.json apps.
'''
import ConfigParser
import GeoIP
import json
import socket
from util.db import DataManager

TASK = [
    'dump_to_json',        # 0
][0]

def main():
    '''
    Convenience method to do preliminary testing in IDE.
    '''
    config = ConfigParser.ConfigParser()
    config.read("../config/truonex.cfg")
    globals()[TASK](config)

def dump_to_json(config):
    counts = {}
    locations = {}
    data = {
        "type":"FeatureCollection",
        "features":[]
    }
    gi = GeoIP.open("/usr/share/GeoIP/GeoLiteCity.dat",GeoIP.GEOIP_STANDARD)
    dbm = DataManager(config)  
    for project in dbm.get_project_data():
        url = project['url']
        if url:
            try:
                domain = url[7:].split('/')[0]
                info = gi.record_by_addr(socket.gethostbyname(domain))
                city = info['city']
                region = info['region']
                country = info['country_code']
                key = "%s::%s::%s" % (city, region, country)
                if key in counts: counts[key] = counts[key] + 1
                else: 
                    counts[key] = 1
                    locations[key] = {"type":"Point","coordinates":[info['longitude'], info['latitude']]}
            except:
                print url
    for key in counts.keys():
        city, region, country = key.split('::')
        feature = {
            "type":"Feature",
            "properties":{"city":city, "region":region, "country":country, "mag":counts[key]},
            "geometry":locations[key],
            'id':key
        }
        data['features'].append(feature)
    fp = open('/var/www/geo-proj/data/projects.json', 'w')
    fp.write(json.dumps(data))
     
if __name__ == "__main__":
    main()    

'''
                        
            
                print info
                feature = {
                    "type":"Feature",
                    "properties":{"title":project['title'], "mag":6.5},
                    "geometry":{"type":"Point","coordinates":[info['longitude'], info['latitude']]},
                    'id':"%s" % project['id']
                }
                data['features'].append(feature)
'''
