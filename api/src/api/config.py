import configparser
from pathlib import Path

# Directory containing config.ini and assets (api/ locally, /channelsdb in Docker)
BASE_DIR = Path(__file__).resolve().parents[2]

config = configparser.ConfigParser(interpolation=configparser.ExtendedInterpolation())
if not config.read(BASE_DIR / 'config.ini'):
    raise IOError(f'Cannot read {BASE_DIR / "config.ini"}')
