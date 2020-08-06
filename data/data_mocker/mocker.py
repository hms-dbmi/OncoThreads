import random
import os
os.chdir(os.path.dirname(__file__))


PATIENT_NUM = 60
TIMEPOINT_NUM = 10
STATUS_DIM = 10
EVENT_DIM = 8
STATE_NUM = 6

treatment_types = ['treat_'+chr(65+i) for i in range(EVENT_DIM)]

timeline_points_mocker_filename = os.path.join(os.getcwd(), "mocker_timeline_specimen.txt" )
timeline_treatment_mocker_filename = os.path.join(os.getcwd(), "mocker_timeline_treatment.txt" )
sample_mocker_filename = os.path.join(os.getcwd(), "mocker_clinical_sample.txt")

patient_len_dict = {}

# mock treatment 
treatment_file = open(timeline_treatment_mocker_filename, 'w')
treatment_file.write('PATIENT_ID\tSTART_DATE\tSTOP_DATE\tEVENT_TYPE\tTREATMENT_TYPE\n')
for patient_idx in range(PATIENT_NUM):
    patient_id = 'patient_'+str(patient_idx)
    for treat in treatment_types:
        last_end = 0
        for _ in range(random.randint(0,2)):
            if last_end == TIMEPOINT_NUM-1:
                break
            start = random.randint(last_end, TIMEPOINT_NUM-2)
            stop = random.randint(start+1, TIMEPOINT_NUM-1)
            last_end = stop
            treatment_file.write(
                "{patient_id}\t{start}\t{stop}\tTREATMENT\t{type}\n".
                format(
                    patient_id=patient_id, start=start, stop=stop, type=treat
                )
            ) 
            patient_len_dict[patient_id] = stop
treatment_file.close()



# mock timepoints
points_file = open(timeline_points_mocker_filename, 'w')
points_file.write("PATIENT_ID\tSTART_DATE\tEVENT_TYPE\tSAMPLE_ID\n")

# mock samples of each timepoints
sample_file = open(sample_mocker_filename, 'w')

sample_header = [
    "#" + '\t'.join(['Patient_Identifier', 'Sample_Identifier'] + ['status_'+chr(i+65) for i in range(STATUS_DIM)]) +'\n',
    "#" + '\t'.join(['Patient_Identifier', 'Sample_Identifier'] + ['status_'+chr(i+65) for i in range(STATUS_DIM)]) +'\n',
    "#" + '\t'.join(['STRING', 'STRING'] + ['NUMBER' for _ in range(STATUS_DIM)]) +'\n',
    "#" + '\t'.join(['1' for _ in range(2 + STATUS_DIM)])+'\n',
    '\t'.join(['PATIENT_ID', 'SAMPLE_ID'] + ['status_'+chr(i+65) for i in range(STATUS_DIM)]) +'\n',
]

sample_file.writelines(sample_header)

from sklearn.datasets import make_blobs
sample_num = sum(patient_len_dict.values())

X, _ = make_blobs(n_samples=sample_num, centers=STATE_NUM, n_features=STATUS_DIM)


sample_idx = 0
for patient_idx in range(PATIENT_NUM):
    patient_id = 'patient_'+str(patient_idx)
    for time_id in range(patient_len_dict[patient_id]):
        sample_id = 'sample_'+str(sample_idx)
        points_file.write(
                "{patient_id}\t{start}\tSPECIMEN\t{sample_id}\n".
                format(
                    patient_id=patient_id, start=time_id, sample_id = sample_id
                )
            ) 

        sample_status = [str(i) for i in X[sample_idx]]
        sample_file.write(
            '{patient_id}\t{sample_id}\t{status}\n'.format(
                patient_id = patient_id, sample_id = sample_id, status = '\t'.join(sample_status)
            )
        )
        sample_idx += 1

points_file.close()
sample_file.close()


