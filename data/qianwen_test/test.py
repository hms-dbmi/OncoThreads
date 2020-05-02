# %%
import json
import pandas as pd
# %%
with open('rootstore.json') as f:
  store = json.load(f)

# sample_vars = [
#     {
#         'name':row['variable'], 
#         'values':list(set(
#             [
#             patient['value'] for patient in row['data']
#             ]
#             ))
#     } 
#     for row in store['variableStores']['sample']['childStore']['timepoints'][0]['heatmap']
# ]

# for var in sample_vars:
#     var['value_dict']={}
#     if isinstance(var['values'][0], str) :
#         for i, value  in enumerate( var['values']):
#             var['value_dict'][value]= i

sample_vars = [
    {
        'name':row['variable'], 
        'values':[],
        'value_dict':{}
    } 
    for row in store['variableStores']['sample']['childStore']['timepoints'][0]['heatmap']
]

for timepoint in store['variableStores']['sample']['childStore']['timepoints']:
    for i, row in enumerate( timepoint['heatmap'] ):
        for patient in row['data']:
            if not patient['value'] in sample_vars[i]['values']:
                sample_vars[i]['values'].append(patient['value'])
                if isinstance(patient['value'], str):
                    sample_vars[i]['value_dict'][patient['value']] = len(sample_vars[i]['values'])

print('sample variables', sample_vars)

# %%
points = []

for timepoint in store['variableStores']['sample']['childStore']['timepoints']:
    
    heatmap = timepoint['heatmap']

    for patient_id in range(len(heatmap[0]['data'])):
        point = [
                heatmap[i]['data'][patient_id]['value']
                if heatmap[i]['data'][patient_id]['value'] else 0
                for i in range(len(sample_vars)) 
                ]
        
        points.append(point)
print(len(points))

# %% category to numerical
num_points = []
for point in points:
    num_point = []
    for i,v in enumerate(point):
        if isinstance(v, str):
            
            num_point.append(sample_vars[i]['value_dict'][v])
        else:
            num_point.append(v)
    
    num_points.append(num_point)

# normalize num points
from sklearn.preprocessing import MinMaxScaler
scaler = MinMaxScaler()
num_points_norm=scaler.fit_transform(num_points)
print(num_points_norm)
# %%
import plotly.express as px
def drawPCP(df):
    fig = px.parallel_coordinates(df)
    fig.show()

# %%
df = pd.DataFrame.from_records(num_points)
drawPCP(df)
# print(df)
# %%
# data projection
import numpy as np
X = np.array(num_points_norm)
# from sklearn.manifold import TSNE
# X_embedded = TSNE(n_components=2).fit_transform(X) 
# print(X_embedded)
from sklearn.decomposition import PCA
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X)


import matplotlib.pyplot as plt
plt.style.use('seaborn-whitegrid')
plt.scatter(
    [d[0] for d in X_pca], 
    [d[1] for d in X_pca])

# %%
from vega import VegaLite
VegaLite({
  "data": {"values": num_points},
  "mark": "point",
  "encoding": {
    "x": {"field": "Horsepower", "type": "quantitative"},
    "y": {"field": "Miles_per_Gallon", "type": "quantitative"}
  }
})


# %%
import matplotlib.pyplot as plt
plt.style.use('seaborn-whitegrid')
plt.scatter(
    [d[1] for d in points], 
    [d[4] for d in points], 
    c= [d[2] for d in num_points],
    s=25,
    cmap='viridis')

# %%
