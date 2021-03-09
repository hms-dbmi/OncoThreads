'''
data is available at the supplementary material of https://clincancerres.aacrjournals.org/content/24/7/1716.long
'''
# %%
import pandas as pd

# %%
'''
process patient data
'''
target_folder = "processed_data"
filename = 'patients.txt'

patients_df = pd.read_excel(
    'Detailed patient characteristics.xlsx', index_col=None)

patient_features = ['UPN', 'Gender', 'Age at Diagnosis',
                    'Time to Relapse', 'AML Type', 'ELN Risk Group']
rename_dict = {
    "UPN": "PATIENT_ID",
    'Age at Diagnosis': 'age',
    'Gender': 'sex',
    'Time to Relapse': 'Relapse Date',
    'AML Type': 'AML',
    'ELN Risk Group': 'ELN RisK'
}
patient_renamed_features = [rename_dict[k] for k in patient_features]

saved_patients = patients_df[patient_features].rename(columns=rename_dict)

patient_header = [
    "#" + '\t'.join(patient_renamed_features) + '\n',
    "#" + '\t'.join(patient_renamed_features) + '\n',
    "#" + '\t'.join(['STRING', 'STRING', 'NUMBER',
                     'NUMBER', 'STRING', 'STRING']) + '\n',
    "#" + '\t'.join(['1' for _ in range(len(patient_renamed_features))])+'\n',
]

with open('processed_data/AML_patients.txt', 'w') as txt_file:
    for line in patient_header:
        txt_file.write(line)

    saved_patients[patient_renamed_features].to_csv(
        txt_file, index=False, sep='\t', na_rep=' ')


# %%
'''
timeline and samples
'''
mutation_df = pd.read_excel(
    'Somatic variants.xlsx', index_col=None)

# mutations = ['DNMT3A', 'FLT3', 'IDH2', 'IDH1']
mutation_freq = mutation_df.Gene.value_counts()
mutations = mutation_freq[mutation_freq >= 8].index.tolist()
timepoints = ['% VAF* Dx', '% VAF* Rem', '% VAF* Rel']

sample_df = pd.DataFrame(
    columns=['PATIENT_ID', 'SAMPLE_ID']+mutations
)
timeline_df = pd.DataFrame(
    columns=['PATIENT_ID', 'START_DATE', 'EVENT_TYPE', 'SAMPLE_ID']
)
for patient_id in patients_df['UPN']:
    if not pd.isna(patient_id):
        sub_df = mutation_df[mutation_df.UPN == patient_id]
        for tp in timepoints:
            sample_id = len(sample_df)
            sample = [patient_id, sample_id]
            for mutation in mutations:
                if mutation in sub_df.Gene.to_list():
                    value = sub_df[sub_df.Gene == mutation][tp].to_list()[0]
                    if value == '-':
                        sample.append(0)
                    else:
                        sample.append(value)
                else:
                    sample.append(0)
            sample_df = sample_df.append(
                pd.Series(sample, index=sample_df.columns), ignore_index=True)

            timeline_df = timeline_df.append({
                'PATIENT_ID': patient_id,
                'START_DATE': timepoints.index(tp),
                'EVENT_TYPE': 'SPECIMEN',
                'SAMPLE_ID': sample_id},
                ignore_index=True)


# %%
timeline_df.to_csv('processed_data/AML_timeline_full.txt',
                   index=False, sep='\t')

sample_header = [
    "#" + '\t'.join(['Patient_Identifier',
                     'Sample_Identifier'] + mutations) + '\n',
    "#" + '\t'.join(['Patient_Identifier',
                     'Sample_Identifier'] + mutations) + '\n',
    "#" + '\t'.join(['STRING', 'STRING'] +
                    ['NUMBER' for key in mutations]) + '\n',
    "#" + '\t'.join(['1' for _ in range(2 + len(mutations))])+'\n',
]

with open('processed_data/AML_obs_full.txt', 'w') as txt_file:
    for line in sample_header:
        txt_file.write(line)
    sample_df.to_csv(txt_file, index=False, sep='\t', na_rep=' ')


# %%
