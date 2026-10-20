import configparser
import os
from pathlib import Path


# Directory containing config.ini and assets (api/ locally, /channelsdb in Docker)
BASE_DIR = Path(__file__).resolve().parents[2]

config = configparser.ConfigParser(interpolation=configparser.ExtendedInterpolation())
if not config.read(BASE_DIR / 'config.ini'):
    raise OSError(f'Cannot read {BASE_DIR / "config.ini"}')

# Overrides the data directory, the other directories are interpolated from it
if base := os.environ.get('CHANNELSDB_BASE'):
    config['dirs']['base'] = base
