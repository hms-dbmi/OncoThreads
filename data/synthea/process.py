#%%
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import seaborn as sns
import datetime

#%%
'''
loading data
'''

SAMPLE_SIZE = 100 # number of sampled inpatients
observation_code = {
    '48065-7': 
    {'name':'D-dimer', 'type': ''}, #
    '2276-4': 
    {'name':'Serum Ferritin', 'type':''},#
    '89579-7': 
    {'name': 'High Sensitivity Cardiac Troponin I', 'type':''},#
    # '731-0': 
    # {'name':'Lymphocytes', 'type': ''}, #
    '14804-9': 
    {'name':'Lactate dehydrogenase', 'type': ''}#
}
TIMEPOINT_ATTR_CODES = [key for key in observation_code]

conditions = pd.read_csv(os.path.join('./originalData/10k_synthea_covid19_csv',"conditions.csv"))
patients = pd.read_csv(os.path.join('./originalData/10k_synthea_covid19_csv',"patients.csv"))
observations = pd.read_csv(os.path.join('./originalData/10k_synthea_covid19_csv',"observations.csv"))
care_plans = pd.read_csv(os.path.join('./originalData/10k_synthea_covid19_csv',"careplans.csv"))
encounters = pd.read_csv(os.path.join('./originalData/10k_synthea_covid19_csv',"encounters.csv"))
devices = pd.read_csv(os.path.join('./originalData/10k_synthea_covid19_csv',"devices.csv"))
supplies = pd.read_csv(os.path.join('./originalData/10k_synthea_covid19_csv','supplies.csv'))
procedures = pd.read_csv(os.path.join('./originalData/10k_synthea_covid19_csv',"procedures.csv"))
medications = pd.read_csv(os.path.join('./originalData/10k_synthea_covid19_csv',"medications.csv"))



#%%
pd.set_option("max_rows", None) 
print([col for col in observations.columns])
#  ['DATE', 'PATIENT', 'ENCOUNTER', 'CODE', 'DESCRIPTION', 'VALUE', 'UNITS', 'TYPE']
print(observations.drop_duplicates('CODE')[['CODE', 'DESCRIPTION']].reset_index(drop=True))


print([col for col in conditions.columns])
print(conditions.drop_duplicates('CODE')[['CODE', 'DESCRIPTION']].reset_index(drop=True))
# ['START', 'STOP', 'PATIENT', 'ENCOUNTER', 'CODE', 'DESCRIPTION']

print([col for col in patients.columns])
# ['Id', 'BIRTHDATE', 'DEATHDATE', 'SSN', 'DRIVERS', 'PASSPORT', 'PREFIX', 'FIRST', 'LAST', 
# 'SUFFIX', 'MAIDEN', 'MARITAL', 'RACE', 'ETHNICITY', 'GENDER', 'BIRTHPLACE', 'ADDRESS', 
# 'CITY', 'STATE', 'COUNTY', 'ZIP', 'LAT', 'LON', 'HEALTHCARE_EXPENSES', 'HEALTHCARE_COVERAGE']

print([col for col in encounters.columns])
# ['Id', 'START', 'STOP', 'PATIENT', 'ORGANIZATION', 'PROVIDER', 'PAYER', 'ENCOUNTERCLASS', 'CODE', 
# 'DESCRIPTION', 'BASE_ENCOUNTER_COST', 'TOTAL_CLAIM_COST', 'PAYER_COVERAGE', 'REASONCODE', 
# 'REASONDESCRIPTION']

#%%
'''
get patient ids
'''


covid_patient_ids = conditions[conditions.CODE == 840539006].PATIENT.unique()

negative_covid_patient_ids = observations[(observations.CODE == '94531-1') & (observations.VALUE == 'Not detected (qualifier value)')].PATIENT.unique()

# that is more thatn thoese died because of COVID
deceased_patients = patients[patients.DEATHDATE.notna()].Id

completed_isolation_patients = care_plans[(care_plans.CODE == 736376001) & (care_plans.STOP.notna()) & (care_plans.REASONCODE == 840539006)].PATIENT

# Survivors are the union of those who have completed isolation at home or have a negative SARS-CoV-2 test.
survivor_ids = np.union1d(completed_isolation_patients, negative_covid_patient_ids)

#  Grab IDs for patients with admission due to COVID-19
inpatient_ids = encounters[(encounters.REASONCODE == 840539006) & (encounters.CODE == 1505002)].PATIENT


sampled_inpatient_ids = inpatient_ids.sample(n = SAMPLE_SIZE)

print('number of inpatient', sampled_inpatient_ids.shape[0])
print('num of inpatient survivors', np.intersect1d( sampled_inpatient_ids, survivor_ids).shape[0])
print("number of inpatient non-survivors", np.intersect1d( sampled_inpatient_ids, deceased_patients).shape[0])




'''
Lab values for COVID-19 patients
'''


#%%
# 
lab_obs = observations[observations['CODE'].isin(TIMEPOINT_ATTR_CODES)]

# Select COVID-19 conditions out of all conditions in the simulation
covid_conditions = conditions[conditions.CODE == 840539006]
covid_conditions = covid_conditions[covid_conditions['PATIENT'].isin(sampled_inpatient_ids)]

#Merge the COVID-19 conditions with the patients
sampled_inpatients = patients[patients['Id'].isin(sampled_inpatient_ids)]
covid_patients = covid_conditions.merge(sampled_inpatients, how='left', left_on='PATIENT', right_on='Id')

# Add an attribute to the DataFrame indicating whether this is a survivor or not.
covid_patients['survivor'] = covid_patients.PATIENT.isin(survivor_ids)

covid_patients = covid_patients[['START', 'PATIENT', 'survivor', 'CODE']]

covid_patients_obs = covid_patients.merge(lab_obs, on='PATIENT')
covid_patients_obs['START'] = pd.to_datetime(covid_patients_obs.START)
covid_patients_obs['DATE'] = pd.to_datetime(covid_patients_obs.DATE)
covid_patients_obs['lab_days'] = covid_patients_obs.DATE - covid_patients_obs.START
covid_patients_obs['days'] = covid_patients_obs.lab_days / np.timedelta64(1, 'D')
covid_patients_obs['VALUE'] = pd.to_numeric(covid_patients_obs['VALUE'], errors='coerce')

# Reduce the columns on the DataFrame to ones needed
timeline_specimen = covid_patients_obs.drop_duplicates(subset=['PATIENT', 'days'])[['PATIENT', 'days']].reset_index(drop=True)
timeline_specimen = timeline_specimen.rename(columns={"PATIENT": "PATIENT_ID", 'days': 'START_DATE'})
timeline_specimen['START_DATE'] = timeline_specimen['START_DATE'].astype('int')
timeline_specimen['EVENT_TYPE'] = "SPECIMEN"
timeline_specimen['SAMPLE_ID'] = ['sample_'+str(i) for i in range(len(timeline_specimen))]


#%%


samples = pd.DataFrame(
    columns=['PATIENT_ID', 'SAMPLE_ID']+[observation_code[key]['name'] for key in observation_code]
    )

prev_row = covid_patients_obs[0:1]
prev_patient = prev_row['PATIENT'][0]
prev_day = prev_row['days'][0]
specimen_idx = 0
specimen = {
    'PATIENT_ID': prev_patient,
    'SAMPLE_ID': 'sample_'+str(specimen_idx)
}
for idx, row in covid_patients_obs.iterrows():
    
    patient_id = row['PATIENT']
    day = row['days']

    if not ((patient_id == prev_patient) and (day == prev_day)):
        specimen_idx += 1

        samples = samples.append(specimen, ignore_index=True)
        specimen = {
            'PATIENT_ID': patient_id,
            'SAMPLE_ID': 'sample_'+str(specimen_idx)
        }

    attr = observation_code[row['CODE_y']]['name']
    if observation_code[row['CODE_y']]['type']=='':
        observation_code[row['CODE_y']]['type'] = row['TYPE']
    value = row['VALUE']
    specimen[attr] = value
    prev_patient = patient_id
    prev_day = day

samples = samples.append(specimen, ignore_index=True)


# %%
# np.savetxt('covid_{}_samples.txt'.format(SAMPLE_SIZE), samples)
# np.savetxt('covid_{}_timeline_samples.txt'.format(SAMPLE_SIZE), timeline_specimen)

'''
save file
'''
# 
# samples.to_csv('covid_{}_samples.txt'.format(SAMPLE_SIZE), index=False, sep='\t')
timeline_specimen.to_csv('processedData/covid_{}_timeline_samples.txt'.format(SAMPLE_SIZE), index=False, sep='\t')

# covert type to the format used in oncoThreads
type_dict ={
    'numeric': 'NUMBER'
}

sample_header = [
    "#" + '\t'.join(['Patient_Identifier', 'Sample_Identifier'] + [observation_code[key]['name'] for key in observation_code]) +'\n',
    "#" + '\t'.join(['Patient_Identifier', 'Sample_Identifier'] + [observation_code[key]['name'] for key in observation_code]) +'\n',
    "#" + '\t'.join(['STRING', 'STRING'] + [type_dict[observation_code[key]['type']] for key in observation_code]) +'\n',
    "#" + '\t'.join(['1' for _ in range(2 + len(observation_code) )])+'\n',
]

with open('processedData/covid_{}_samples.txt'.format(SAMPLE_SIZE), 'w') as txt_file:
    for line in sample_header:
        txt_file.write(line)
    samples.to_csv(txt_file, index=False, sep='\t', na_rep= ' ')
# %%
'''
plot
'''
loinc_to_display = {'CODE_y = 48065-7': 'D-dimer', 'CODE_y = 2276-4': 'Serum Ferritin',
                    'CODE_y = 89579-7': 'High Sensitivity Cardiac Troponin I',
                    'CODE_y = 26881-3': 'IL-6', 'CODE_y = 731-0': 'Lymphocytes',
                    'CODE_y = 14804-9': 'Lactate dehydrogenase'}
catplt = sns.catplot(x="days", y="VALUE", hue="survivor", kind="box", col='CODE_y', 
            col_wrap=2, sharey=False, sharex=False, data=covid_patients_obs, palette=["C1", "C0"])

for axis in catplt.fig.axes:
    axis.xaxis.set_major_formatter(ticker.FormatStrFormatter('%d'))
    axis.xaxis.set_major_locator(ticker.MultipleLocator(base=4))
    axis.set_title(loinc_to_display[axis.title.get_text()])
        
plt.show()
# %%
