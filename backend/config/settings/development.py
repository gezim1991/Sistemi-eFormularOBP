from .base import *  # noqa

DEBUG = True


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "DEBUG"},
    "loggers": {
        "django.db.backends": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
