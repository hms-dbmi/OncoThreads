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
    'Time to Relapse': 'Relapse Days',
    'AML Type': 'AML',
    'ELN Risk Group': 'ELN RisK'
}
patient_renamed_features = [rename_dict[k] for k in patient_features]

saved_patients = patients_df[patient_features].rename(columns=rename_dict)

# %%
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
variant_df = pd.read_excel(
    'Somatic variants.xlsx', index_col=None)

# mutations = ['DNMT3A', 'FLT3', 'IDH2', 'IDH1']
mutation_freq = variant_df.Gene.value_counts()
mutations = mutation_freq[mutation_freq >= 5].index.tolist()
timepoints = ['% VAF* Dx', '% VAF* Rem', '% VAF* Rel']

sample_ids = []
sample_df = pd.DataFrame(
    columns=['PATIENT_ID', 'SAMPLE_ID']+mutations
)
timeline_df = pd.DataFrame(
    columns=['PATIENT_ID', 'START_DATE', 'EVENT_TYPE', 'SAMPLE_ID']
)


for patient_id in patients_df['UPN']:
    if not pd.isna(patient_id):
        sub_df = variant_df[variant_df.UPN == patient_id]
        for tp_idx, tp in enumerate(timepoints):
            sample_id = '{}_{}'.format(patient_id, tp_idx)
            sample_ids.append(sample_id)

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
                'START_DATE': tp_idx,
                'EVENT_TYPE': 'SPECIMEN',
                'SAMPLE_ID': sample_id},
                ignore_index=True)


# %%
timeline_df.to_csv('processed_data/AML_timeline.txt',
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

with open('processed_data/AML_sample_freq.txt', 'w') as txt_file:
    for line in sample_header:
        txt_file.write(line)
    sample_df.to_csv(txt_file, index=False, sep='\t', na_rep=' ')


# %%
mutation_header = [
    'Hugo_Symbol',  # 'Gene'
    'HGVSp_Short',  # Protein Change":
    'Variant_Classification',  # Missense_Mutation for place holder
    'Chromosome',
    'Position',
    'Ref',
    'Transcript',
    'Tumor_Sample_Barcode'  # sample id
]

mutation_df = pd.DataFrame(
    columns=mutation_header
)


for row_idx, row in variant_df.iterrows():
    patient_id = row['UPN']
    for tp_idx, tp in enumerate(timepoints):
        mutation_row = [
            row['Gene'],
            row['Protein Change'],
            'Missense_Mutation',
            row['Chromosome'],
            row['Position (hg19)'],
            row['Ref'],
            row['Transcript']
        ]
        sample_id = '{}_{}'.format(patient_id, tp_idx)
        if row[tp] != '-':
            mutation_row.append(sample_id)
            mutation_df = mutation_df.append(
                pd.Series(mutation_row, index=mutation_header), ignore_index=True
            )
mutation_df.to_csv('processed_data/AML_mutation.txt',
                   index=False, sep='\t', na_rep=' ')
# %%

VAF_df = pd.DataFrame(
    columns=['Hugo_Symbol', 'Entrez_Gene_Id']+sample_ids
)

unique_genes = variant_df.Gene.unique().tolist()
for gene in unique_genes:
    VAF_df = VAF_df.append({'Hugo_Symbol': gene}, ignore_index=True)


VAF_df = VAF_df.set_index('Hugo_Symbol')
for row_idx, row in variant_df.iterrows():
    gene = row['Gene']
    patient_id = row['UPN']
    for tp_idx, tp in enumerate(timepoints):
        sample_id = '{}_{}'.format(patient_id, tp_idx)
        if row[tp] != '-':
            VAF_df.loc[gene, sample_id] = row[tp]

VAF_df.to_csv('processed_data/AML_CNV.txt', sep='\t', na_rep='NA')
# %%
