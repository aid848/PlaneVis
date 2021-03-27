import pandas as pd
import numpy as np

# Read files
ac = pd.read_csv("airline_accidents.csv",engine='python') #Accident Number

na = pd.read_csv("ntsb_aviation_data.csv",engine='python') # NTSB_RPRT_NBR



# filter unused attributes

# AC
ac_columns = ['Accident Number','Amateur Built','Aircraft Damage','Location','Airport Name','Country','Latitude','Longitude','Model','Make','Broad Phase of Flight','Registration Number','Event Date','Injury Severity','Total Fatal Injuries', 'Total Serious Injuries','Total Minor Injuries','Total Uninjured', 'Engine Type', 'Number of Engines','Purpose of Flight']
ac = ac[ac_columns]
for col in ac_columns: # remove annoying trailing space in columns
    ac[col] = [a.strip() for a in ac[col]] 

# NA
na_columns = ['NTSB_RPRT_NBR', 'LOC_STATE_CODE_STD', 'ARPT_NAME_STD','ACFT_NSDC_MODEL_STD', 'ACFT_NSDC_MAKE_STD', 'FLIGHT_PHASE_DESC','ACFT_SERIAL_NBR','EVENT_LCL_DATE','INJURY_DESC','ACFT_REGIST_NBR']
na = na[na_columns]

# rename bad columns
fixed_cols_na={
    'NTSB_RPRT_NBR':'NTSB Report Number',
    'LOC_STATE_CODE_STD': 'State',
    'ARPT_NAME_STD' : 'Airport Name',
    'ACFT_NSDC_MODEL_STD' : 'Model',
    'ACFT_NSDC_MAKE_STD' : 'Make',
    'FLIGHT_PHASE_DESC': 'Flight Phase',
    'ACFT_SERIAL_NBR': 'Serial Number',
    'EVENT_LCL_DATE' : 'Event Date',
    'INJURY_DESC' : 'Injury Description',
    'ACFT_REGIST_NBR' : 'Registration Number'
    }
na.rename(columns = fixed_cols_na, inplace = True)


# Filter to only 1978-2020 events inclusive

# AC
ac['Event Date'].replace('',np.nan,inplace=True) # find empty values
ac.dropna(subset=['Event Date'], inplace=True) # remove invalid dates
ac['Event Date'] = pd.to_datetime(ac['Event Date'],format="%m/%d/%Y") # set date format
ac = ac[ (ac['Event Date'] >= '1978-01-01') & (ac['Event Date'] <= '2020-12-31')] # select date range

# NA
na['Event Date'].replace('',np.nan,inplace=True) # find empty values
na.dropna(subset=['Event Date'], inplace=True) # remove invalid dates
na['Event Date'] = pd.to_datetime(na['Event Date'],format="%d-%b-%y") # set date format
na = na[ (na['Event Date'] >= '1978-01-01') & (na['Event Date'] <= '2020-12-31')] # select date range


# TODO  Remove examples with empty, null, annoying, or invalid values (check per attribute as empty may be acceptable for some attributes).

# AC make should be capitalized like NA
ac['Make'] = [a.upper() for a in ac['Make']] 


# Save filtered data
ac.to_csv('airline_accidents_new.csv',header=True)
na.to_csv('ntsb_aviation_data_new.csv',header=True)




# simplify the join
ac.rename(columns={'Accident Number':'NTSB Report Number'}, inplace = True)

joinedTable = pd.merge(ac,na,how='inner',on='NTSB Report Number',suffixes = ['_ac','_na']) # Perform table inner join

# Save new table

joinedTable.to_csv('joinTable.csv',header=True)
