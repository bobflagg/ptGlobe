from geo import project_data as pd
import ConfigParser
config = ConfigParser.ConfigParser()
config.read("config/truonex.cfg")
pd.dump_to_json(config)

