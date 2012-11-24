'''
Utility module for dumping project data to a json file suitable for use
in geo.json apps.

import ConfigParser
from geo import project_data as pd
config = ConfigParser.ConfigParser()
config.read("config/truonex.cfg")
pd.dump_to_json(config)
'''
import ConfigParser
import GeoIP
import json
import socket
from util.db import DataManager
from random import random

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
    data_dir = "/home/birksworks/Dev/ptGlobe/www/data"
    counts = {}
    locations = {}
    data = {
        "type":"FeatureCollection",
        "features":[]
    }
    city_data = {}
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
                if key in counts: 
                    counts[key] = counts[key] + 1
                else: 
                    counts[key] = 1
                    locations[key] = {"type":"Point","coordinates":[info['longitude'], info['latitude']]}
                    city_data[key] = {}                       
                city_data[key][project['id']] = [
                    info['longitude'] + (2.0 * round(random(),2) - 1.0) / 10.0, 
                    info['latitude'] + round((2.0 * random() - 1.0), 1) / 10.0, 
                    project['title']
                ]
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
        longitude = locations[key]["coordinates"][0]
        latitude = locations[key]["coordinates"][1]
        if counts[key] <= 10:
            n_sites = counts[key]
        elif counts[key] <= 40:
            n_sites = counts[key] / 2
        else:
            n_sites = 20
        site_data = {}
        for i in range(n_sites):
            site_data["%d" % (i + 1)] = [
                longitude + (2.0 * round(random(),2) - 1.0) / 10.0, 
                latitude + round((2.0 * random() - 1.0), 1) / 10.0, 
                "%s Research Site %d" % (city, i + 1)
            ]
        fp = open('%s/%s.json' % (data_dir, key.replace('::', '-')), 'w')
        fp.write(json.dumps(site_data))
        fp.close()
    fp = open('%s/cities.json' % data_dir, 'w')
    fp.write(json.dumps(data))
    fp.close()
     
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